import crypto from 'node:crypto'
import config from 'config'
import { type Request, type Response } from 'express'
import jwt from 'jsonwebtoken'
import jws from 'jws'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type AuthenticatorTransport
} from '@simplewebauthn/server'
import { COSEALG, isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers'

import { PasskeyModel } from '../models/passkey'
import { BasketModel } from '../models/basket'
import { UserModel } from '../models/user'
import * as security from '../lib/security'
import * as utils from '../lib/utils'

function relyingParty (req: Request) {
  const host = (req.get('x-forwarded-host') ?? req.get('host') ?? '').split(',')[0].trim()
  return { rpID: req.hostname, origin: `${req.protocol}://${host}`, rpName: config.get<string>('application.name') }
}

const supportedAlgorithmIDs = [COSEALG.EdDSA, COSEALG.ES256, COSEALG.RS256]

const ceremonySecret = crypto.randomBytes(32).toString('hex')
const ceremonyTokenLifetime = 5 * 60

function signCeremonyToken (payload: Record<string, unknown>) {
  return jwt.sign({ ...payload, exp: Math.round(Date.now() / 1000) + ceremonyTokenLifetime }, ceremonySecret, { algorithm: 'HS256' })
}

function verifyCeremonyToken (token: unknown, type: string): Record<string, any> | undefined {
  if (typeof token !== 'string' || jws.decode(token)?.header?.alg !== 'HS256') return undefined
  let payload: Record<string, any> | undefined
  jwt.verify(token, ceremonySecret, (err: unknown, decoded: any) => { if (!err) payload = decoded })
  return payload?.type === type ? payload : undefined
}

function toTransports (passkey: PasskeyModel) {
  return passkey.transports ? passkey.transports.split(',') as AuthenticatorTransport[] : undefined
}

async function issuePasskeySession (user: UserModel, res: Response) {
  const plainUser = utils.queryResultToJson(user).data
  const [basket] = await BasketModel.findOrCreate({ where: { UserId: user.id } })
  const authenticatedUser = { data: plainUser, bid: basket.id }
  const token = security.authorize(authenticatedUser)
  security.authenticatedUsers.put(token, authenticatedUser)
  res.json({ authentication: { token, bid: basket.id, umail: user.email } })
}

export async function registerOptions (req: Request, res: Response) {
  const data = security.authenticatedUsers.from(req)
  if (!data) {
    res.status(401).send()
    return
  }
  const { data: user } = data
  const { rpID, rpName } = relyingParty(req)

  const existing = await PasskeyModel.findAll({ where: { UserId: user.id } })
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.email,
    userID: isoUint8Array.fromUTF8String(String(user.id)),
    attestationType: 'none',
    excludeCredentials: existing.map((passkey) => ({
      id: passkey.credentialID,
      transports: toTransports(passkey)
    })),
    authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
    supportedAlgorithmIDs
  })

  const regToken = signCeremonyToken({ userId: user.id, challenge: options.challenge, type: 'passkey_reg' })
  res.json({ options, regToken })
}

export async function registerVerify (req: Request, res: Response) {
  const data = security.authenticatedUsers.from(req)
  if (!data) {
    res.status(401).send()
    return
  }
  const { data: user } = data
  const { attestation, regToken } = req.body
  const { rpID, origin } = relyingParty(req)

  const decoded = verifyCeremonyToken(regToken, 'passkey_reg')
  if (!decoded || decoded.userId !== user.id) {
    res.status(401).send()
    return
  }

  const verification = await verifyRegistrationResponse({
    response: attestation,
    expectedChallenge: decoded.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: false,
    supportedAlgorithmIDs
  })
  if (!verification.verified || !verification.registrationInfo) {
    res.status(400).json({ error: 'not verified' })
    return
  }

  const { credential, aaguid } = verification.registrationInfo
  const credentialID = credential.id
  const publicKey = isoBase64URL.fromBuffer(credential.publicKey)
  const transports = (attestation.response?.transports ?? []).join(',')

  const existing = await PasskeyModel.findOne({ where: { credentialID } })
  if (existing) {
    existing.publicKey = publicKey
    existing.counter = credential.counter
    existing.transports = transports
    existing.aaguid = aaguid
    await existing.save()
  } else {
    await PasskeyModel.create({ UserId: user.id, credentialID, publicKey, counter: credential.counter, transports, aaguid })
  }

  res.json({ verified: true })
}

export async function loginOptions (req: Request, res: Response) {
  const { email } = req.body
  const { rpID } = relyingParty(req)

  let allowCredentials
  if (typeof email === 'string' && email) {
    const passkeys = await PasskeyModel.findAll({ include: [{ model: UserModel, where: { email }, attributes: [] }] })
    allowCredentials = passkeys.map((passkey) => ({
      id: passkey.credentialID,
      transports: toTransports(passkey)
    }))
  }

  const options = await generateAuthenticationOptions({ rpID, allowCredentials, userVerification: 'preferred' })
  const authToken = signCeremonyToken({ challenge: options.challenge, type: 'passkey_auth' })
  res.json({ options, authToken })
}

export async function loginVerify (req: Request, res: Response) {
  const { assertion, authToken } = req.body
  const { rpID, origin } = relyingParty(req)

  const decoded = verifyCeremonyToken(authToken, 'passkey_auth')
  if (!decoded || typeof assertion?.id !== 'string') {
    res.status(401).send()
    return
  }

  const passkey = await PasskeyModel.findOne({ where: { credentialID: assertion.id } })
  if (!passkey) {
    res.status(401).send(res.__('No account found for this passkey.'))
    return
  }

  const verification = await verifyAuthenticationResponse({
    response: assertion,
    expectedChallenge: decoded.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: false,
    credential: {
      id: passkey.credentialID,
      publicKey: isoBase64URL.toBuffer(passkey.publicKey),
      counter: passkey.counter,
      transports: toTransports(passkey)
    }
  })

  const user = await UserModel.findByPk(passkey.UserId)
  if (!user) {
    res.status(401).send(res.__('No account found for this passkey.'))
    return
  }

  if (verification.verified) {
    passkey.counter = verification.authenticationInfo.newCounter
    await passkey.save()
  }
  await issuePasskeySession(user, res)
}

export async function listCredentials (req: Request, res: Response) {
  const data = security.authenticatedUsers.from(req)
  if (!data) {
    res.status(401).send()
    return
  }
  const passkeys = await PasskeyModel.findAll({ where: { UserId: data.data.id } })
  res.json({
    data: passkeys.map((passkey) => ({
      id: passkey.id,
      credentialID: passkey.credentialID,
      transports: passkey.transports,
      aaguid: passkey.aaguid,
      createdAt: passkey.createdAt
    }))
  })
}

export async function deleteCredential (req: Request, res: Response) {
  const data = security.authenticatedUsers.from(req)
  if (!data) {
    res.status(401).send()
    return
  }
  await PasskeyModel.destroy({ where: { id: req.params.id, UserId: data.data.id } })
  res.status(204).send()
}

export function passkeyEndpoints (req: Request, res: Response) {
  const url = `${relyingParty(req).origin}/#/privacy-security/passkeys`
  res.json({ enroll: url, manage: url })
}
