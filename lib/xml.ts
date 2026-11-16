import vm from 'node:vm'

const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>
let libxml2Promise: Promise<any> | undefined

async function loadLibxml2 () {
  if (libxml2Promise == null) {
    libxml2Promise = (async () => {
      const libxml2 = await dynamicImport('libxml2-wasm')
      const { xmlRegisterFsInputProviders } = await dynamicImport('libxml2-wasm/lib/nodejs.mjs')
      xmlRegisterFsInputProviders()
      return libxml2
    })()
  }
  return await libxml2Promise
}

export async function parseXmlString (data: string, timeoutMs = 2000): Promise<string> {
  const libxml2 = await loadLibxml2()
  const option = libxml2.ParseOption.XML_PARSE_NOENT | libxml2.ParseOption.XML_PARSE_DTDLOAD | libxml2.ParseOption.XML_PARSE_NOBLANKS | libxml2.ParseOption.XML_PARSE_NOCDATA
  const sandbox = { libxml2, data, option }
  vm.createContext(sandbox)
  const xmlDoc = vm.runInContext('libxml2.XmlDocument.fromString(data, { option })', sandbox, { timeout: timeoutMs })
  const xmlString = xmlDoc.toString()
  xmlDoc.dispose()
  return xmlString
}
