import packageJson from '../package.json'
import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import logger from './logger'
import { ProxyAgent } from 'proxy-agent'
import crypto from 'node:crypto'
import clarinet from 'clarinet'

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const proxyAgent = new ProxyAgent()

export const queryResultToJson = <T>(
  data: T,
  status: string = 'success'
): { data: T, status: string } => {
  return {
    status,
    data
  }
}

export const isUrl = (url: string) => {
  return url.startsWith('http')
}

export const unquote = function (str: string) {
  if (str && str.startsWith('"') && str.endsWith('"')) {
    return str.substring(1, str.length - 1)
  } else {
    return str
  }
}

export const trunc = function (str: string, length: number) {
  str = str.replace(/(\r\n|\n|\r)/gm, '')
  return (str.length > length) ? str.substr(0, length - 1) + '...' : str
}

export const version = (module?: string) => {
  if (module) {
    // @ts-expect-error
    return packageJson.dependencies[module]
  } else {
    return packageJson.version
  }
}

export const toMMMYY = (date: Date) => {
  const month = date.getMonth()
  const year = date.getFullYear()
  return months[month] + year.toString().substring(2, 4)
}

export const toISO8601 = (date: Date) => {
  let day = '' + date.getDate()
  let month = '' + (date.getMonth() + 1)
  const year = date.getFullYear()

  if (month.length < 2) month = '0' + month
  if (day.length < 2) day = '0' + day

  return [year, month, day].join('-')
}

export const extractFilename = (url: string) => {
  let file = decodeURIComponent(url.substring(url.lastIndexOf('/') + 1))
  if (file ? file.includes('?') : false) {
    file = file.substring(0, file.indexOf('?'))
  }
  return file
}

interface DownloadOptions {
  agent?: http.Agent
}

const download = async (url: string, options: DownloadOptions, redirectsLeft = 10): Promise<Buffer> => {
  return await new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http
    client.get(url, { agent: options.agent }, (res) => {
      const status = res.statusCode ?? 0
      if (status >= 300 && status < 400 && res.headers.location) {
        res.resume()
        if (redirectsLeft > 0) {
          download(new URL(res.headers.location, url).toString(), options, redirectsLeft - 1).then(resolve, reject)
        } else {
          reject(new Error('Too many redirects'))
        }
      } else if (status < 200 || status >= 300) {
        res.resume()
        reject(new Error(`Response code ${status}`))
      } else {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => resolve(Buffer.concat(chunks)))
        res.on('error', reject)
      }
    }).on('error', reject)
  })
}

export const replaceInFile = (file: string, regex: string | RegExp, replacement: string) => {
  const content = fs.readFileSync(file, 'utf8')
  const replaced = content.replace(new RegExp(regex, 'gm'), replacement)
  if (replaced !== content) {
    fs.writeFileSync(file, replaced)
  }
}

export const downloadToFile = async (
  url: string,
  dest: string,
  downloadData: (url: string, options: DownloadOptions) => Promise<Buffer> = download
) => {
  try {
    const data = await downloadData(url, { agent: proxyAgent })
    fs.writeFileSync(dest, data)
    return true
  } catch (err) {
    logger.warn('Failed to download ' + url + ' (' + getErrorMessage(err) + ')')
    return false
  }
}

export const jwtFrom = ({ headers }: { headers: any }) => {
  if (headers?.authorization) {
    const parts = headers.authorization.split(' ')
    if (parts.length === 2) {
      const scheme = parts[0]
      const token = parts[1]

      if (/^Bearer$/i.test(scheme)) {
        return token
      }
    }
  }
  return undefined
}

export const randomHexString = (length: number): string => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length)
}

export const parseJsonCustom = (jsonString: string) => {
  const parser = clarinet.parser()
  const result: any[] = []
  parser.onkey = parser.onopenobject = (k: any) => {
    result.push({ key: k, value: null })
  }
  parser.onvalue = (v: any) => {
    result[result.length - 1].value = v
  }
  parser.write(jsonString)
  parser.close()
  return result
}

export const toSimpleIpAddress = (ipv6: string) => {
  if (ipv6?.startsWith('::ffff:')) {
    return ipv6.substr(7)
  } else if (ipv6 === '::1') {
    return '127.0.0.1'
  } else {
    return ipv6
  }
}

export const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  return String(error)
}

export const asyncHandler = (fn: (req: any, res: any, next: any) => Promise<any> | any) => (req: any, res: any, next: any) => {
  void Promise.resolve(fn(req, res, next)).catch(next)
}
