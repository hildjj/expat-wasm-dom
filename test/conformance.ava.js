import {DomParser, NS} from '../lib/index.js'
import {fileURLToPath, pathToFileURL} from 'url'
import fs from 'fs'
import path from 'path'
import test from 'ava'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const root = pathToFileURL(__dirname).toString()

function parseFile(name) {
  return fs.promises.readFile(name).then(buf => DomParser.parseFull(buf, {
    base: name.toString(),
    xmlBase: true,
    systemEntity(base, sysId, pubId) {
      const newBase = new URL(sysId, base)
      const bs = newBase.toString()
      if (!bs.startsWith(root)) {
        throw new Error(`Trying to read outside root: "${bs}"`)
      }
      return {
        base: bs,
        data: fs.readFileSync(newBase),
      }
    },
  }))
}

const confnameURL = new URL(
  pathToFileURL(path.resolve(path.join(__dirname, 'xmlconf', 'xmlconf.xml')))
)

const conf = await parseFile(confnameURL)

const skip = {
  'valid-sa-012': 'expat issue 1, always uses 1.1 rules for attribute name containing only colon',
  'rmt-e2e-50': 'potential expat issue 4, does not allow U+0085 as whitespace',
}

/**
 * @param {import('../lib/index.js').dom.Element} el
 * @param {URL} base
 * @param {import('ava').ExecutionContext} t
 */
async function execTests(el, base, t) {
  const b = el.attr('base', NS.XML)
  if (b) {
    base = new URL(b, base)
  }

  if (el.name.local === 'TEST') {
    const rec = el.attr('RECOMMENDATION')
    if ([
      'XML1.0',
      'NS1.0',
      'XML1.0-errata2e',
      'XML1.0-errata3e',
      // 'NS1.1',
      // 'XML1.0-errata4e', See: https://github.com/libexpat/libexpat/issues/171
      // 'XML1.1',          See: https://github.com/libexpat/libexpat/issues/378
      //
    ].indexOf(rec) !== -1) {
      const id = el.attr('ID')
      const reason = skip[id]
      if (reason) {
        const uri = new URL(el.attr('URI'), base)
        t.throwsAsync(() => parseFile(uri), undefined, id)
      } else {
        const uri = new URL(el.attr('URI'), base)
        if (el.attr('TYPE') === 'valid') {
          const doc = await parseFile(uri)
          t.truthy(doc, id)
        }
      }
    }
  } else {
    for (const c of el.elements()) {
      await execTests(c, base, t)
    }
  }
}

test('conformance', t => execTests(conf.root, confnameURL, t))
