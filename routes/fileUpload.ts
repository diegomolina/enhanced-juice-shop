/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import fs from 'node:fs'
import vm from 'node:vm'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import yaml from 'js-yaml'
import unzipper from 'unzipper'
import { type NextFunction, type Request, type Response } from 'express'

import * as utils from '../lib/utils'
import { parseXmlString } from '../lib/xml'

function ensureFileIsPassed ({ file }: Request, res: Response, next: NextFunction) {
  if (file != null) {
    next()
  } else {
    return res.status(400).json({ error: 'File is not passed' })
  }
}

async function extractZipBuffer (buffer: Buffer) {
  const directory = await unzipper.Open.buffer(buffer)
  for (const entry of directory.files) {
    const fileName = entry.path
    const absolutePath = path.resolve('uploads/complaints/' + fileName)
    if (absolutePath.includes(path.resolve('.'))) {
      await pipeline(entry.stream(), fs.createWriteStream('uploads/complaints/' + fileName))
    }
  }
}

async function handleZipFileUpload ({ file }: Request, res: Response, next: NextFunction) {
  if (!(file?.originalname?.toLowerCase().endsWith('.zip') ?? false)) {
    next()
    return
  }
  if ((file?.buffer) != null) {
    try {
      await extractZipBuffer(file.buffer)
    } catch (err) {
      next(err)
      return
    }
  }
  res.status(204).end()
}

async function handleXmlUpload ({ file }: Request, res: Response, next: NextFunction) {
  if (!(file?.originalname?.toLowerCase().endsWith('.xml') ?? false)) {
    next()
    return
  }
  if ((file?.buffer) != null) {
    const data = file.buffer.toString()
    try {
      const xmlString = await parseXmlString(data)
      res.status(410)
      next(new Error('B2B customer complaints via file upload have been deprecated for security reasons: ' + utils.trunc(xmlString, 400) + ' (' + file.originalname + ')'))
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (errorMessage.includes('Script execution timed out')) {
        res.status(503)
        next(new Error('Sorry, we are temporarily not available! Please try again later.'))
      } else {
        res.status(410)
        next(new Error('B2B customer complaints via file upload have been deprecated for security reasons: ' + errorMessage + ' (' + file.originalname + ')'))
      }
    }
  } else {
    res.status(410)
    next(new Error('B2B customer complaints via file upload have been deprecated for security reasons (' + file?.originalname + ')'))
  }
}

function handleYamlUpload ({ file }: Request, res: Response, next: NextFunction) {
  if (!((file?.originalname?.toLowerCase().endsWith('.yml') ?? false) || (file?.originalname?.toLowerCase().endsWith('.yaml') ?? false))) {
    res.status(204).end()
    return
  }
  if ((file?.buffer) != null) {
    const data = file.buffer.toString()
    try {
      const sandbox = { yaml, data }
      vm.createContext(sandbox)
      const yamlString = vm.runInContext('JSON.stringify(yaml.load(data))', sandbox, { timeout: 2000 })
      res.status(410)
      next(new Error('B2B customer complaints via file upload have been deprecated for security reasons: ' + utils.trunc(yamlString, 400) + ' (' + file.originalname + ')'))
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (errorMessage.includes('Invalid string length') || errorMessage.includes('Script execution timed out')) {
        res.status(503)
        next(new Error('Sorry, we are temporarily not available! Please try again later.'))
      } else {
        res.status(410)
        next(new Error('B2B customer complaints via file upload have been deprecated for security reasons: ' + errorMessage + ' (' + file.originalname + ')'))
      }
    }
  } else {
    res.status(410)
    next(new Error('B2B customer complaints via file upload have been deprecated for security reasons (' + file?.originalname + ')'))
  }
}

export {
  ensureFileIsPassed,
  handleZipFileUpload,
  handleXmlUpload,
  handleYamlUpload
}
