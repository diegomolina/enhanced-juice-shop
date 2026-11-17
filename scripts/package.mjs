import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import { createWriteStream, globSync, statSync } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execSync } from 'node:child_process'
import { parseArgs } from 'node:util'

function loadArchiver () {
  const require = createRequire(import.meta.url)
  try {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim()
    return require(path.join(globalRoot, 'archiver'))
  } catch {
    console.error('archiver is not installed. Run: npm install -g archiver')
    process.exit(1)
  }
}

const { TarArchive, ZipArchive } = loadArchiver()

const { values: args } = parseArgs({
  options: {
    'archive-format': { type: 'string' }
  }
})

const format = args['archive-format'] ?? process.env.PCKG_FORMAT

if (format !== 'tgz' && format !== 'zip') {
  console.error('Usage: node scripts/package.mjs --archive-format=tgz|zip  (or set PCKG_FORMAT env var)')
  process.exit(1)
}

const osName = process.env.PCKG_OS_NAME || ''
const cpuArch = process.env.PCKG_CPU_ARCH || ''
const nodeVer = process.env.PCKG_NODE_VERSION || process.env.nodejs_version || ''

const pkgPath = 'package.json'
const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'))
if (nodeVer) pkg.engines = { ...pkg.engines, node: nodeVer }
if (osName) pkg.os = [osName]
if (cpuArch) pkg.cpu = [cpuArch]
await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

const ext = format === 'tgz' ? '.tgz' : '.zip'
const archiveName = `${pkg.name}-${pkg.version}` +
  (nodeVer ? `_node${nodeVer}` : '') +
  (osName ? `_${osName}` : '') +
  (cpuArch ? `_${cpuArch}` : '') +
  ext
const archivePath = path.join('dist', archiveName)
const prefix = `test-shop_${pkg.version}`

await fs.mkdir('dist', { recursive: true })

const files = globSync([
  '.well-known/**',
  'LICENSE',
  '*.md',
  'package.json',
  'swagger.yml',
  'server.ts',
  'build/**',
  'bom.json',
  'bom.xml',
  'config/*.yml',
  'data/*.ts',
  'data/static/**',
  'encryptionkeys/**',
  'frontend/dist/frontend/**',
  'frontend/dist/bom/**',
  'frontend/src/**/*.ts',
  'ftp/**',
  'i18n/.gitkeep',
  'lib/**',
  'models/*.ts',
  'node_modules/**',
  'routes/*.ts',
  'uploads/complaints/.gitkeep',
  'views/**'
], { exclude: (file) => file.replaceAll('\\', '/').startsWith('build/reports') })
  .filter((file) => statSync(file).isFile())

await new Promise((resolve, reject) => {
  const archive = format === 'tgz'
    ? new TarArchive({ gzip: true, gzipOptions: { level: 9 } })
    : new ZipArchive()

  const output = createWriteStream(archivePath)
  output.on('close', resolve)
  archive.on('error', reject)
  archive.pipe(output)

  for (const file of files) {
    archive.file(file, { name: `${prefix}/${file}` })
  }

  archive.finalize()
})

console.log(`Created ${archivePath}`)

for (const file of await fs.readdir('dist')) {
  if (file.endsWith('.md5')) continue
  const filePath = path.join('dist', file)
  if (!(await fs.stat(filePath)).isFile()) continue
  const content = await fs.readFile(filePath)
  const hash = crypto.createHash('md5').update(content).digest('hex')
  const hashFile = `${filePath}.md5`
  await fs.writeFile(hashFile, hash)
  console.log(`Checksum ${hash} written to ${hashFile}`)
}
