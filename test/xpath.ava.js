import {DomParser, XPath, xml} from '../lib/index.js'
import test from 'ava'
import util from 'util'

test('get', t => {
  const doc = DomParser.parseFull(`<foo>
  <bar loo='nod'>No Never</bar>
  <bar loo='bod' load='heavy'><doo first='yes'/></bar>
  <too toad='sprocket' xmlns:c='urn:c' c:too='oot'/>
  <!-- a comment -->
  <bar/>
  <dar>
    <doo>Done</doo>
    <dod>Dope</dod>
  </dar>
  <dar>
    <doo>Nope</doo>
  </dar>
  <dar>
    <dod>Doze</dod>
  </dar>
  <bar loo="skip">baz</bar>
  <deep><yes><no>huh</no></yes></deep>
  <daz/>
</foo>`)
  t.deepEqual(
    doc.get('/foo/bar[2]').map(e => e.toString()),
    ['<bar loo="bod" load="heavy"><doo first="yes"/></bar>']
  )
  t.is(doc.first('/foo/bar').toString(), '<bar loo="nod">No Never</bar>')
  t.is(doc.first('/foo/bort'), null)
  t.is(doc.first('too/@toad/text()'), 'sprocket')
  t.is(doc.first('doo', doc.root.first('dar')).toString(), '<doo>Done</doo>')
  t.is(doc.first('/'), doc)
  t.deepEqual(doc.get('/foo/bar/@loo/text()'), ['nod', 'bod', 'skip'])
  t.is(doc.first('/foo/bar/@loo/lo'), null)
  t.throws(() => doc.first('/foo/bar/@loo/@lo'))
  t.is(doc.first('/boo'), null)
  t.is(doc.first('/foo/bar[@loo="skip"]/text()'), 'baz')
  t.is(doc.first('/foo/bar[text()="No Never"]').toString(), '<bar loo="nod">No Never</bar>')
  t.deepEqual(doc.get('/foo/dar[doo="Done"]/dod/text()'), ['Dope'])
  t.deepEqual(doc.get('/foo/dar[doo]/doo/text()'), ['Done', 'Nope'])
  t.deepEqual(doc.get('*/doo/text()'), ['', 'Done', 'Nope'])
  t.deepEqual(doc.get('too/@*/text()'), ['sprocket', 'oot'])
  t.is(doc.get('//bar').length, 4)
  t.is(doc.first('//bar/@*/load/text()'), 'heavy')
  t.is(doc.root.get('./dar').length, 3)
  t.is(doc.root.get('deep//no').length, 1)
  t.is(doc.root.get('deep//*').length, 2)
  t.is(doc.first('//no/..'), doc.first('//yes'))
  t.is(doc.first('//*/comment()').toString(), '<!-- a comment -->')
  t.is(doc.get('//comment()').length, 1)
  t.is(doc.get('../*')[0], doc.root)
  t.is(doc.get('//@loo').length, 3)
  t.is(doc.get('//..').length, 45)
  t.is(doc.get('bar,dar').length, 7)
})

test('inputs', t => {
  const doc = xml`<foo><bar/></foo>`
  const xp = new XPath('/foo')
  const foo = doc.first(xp)
  t.is(foo.toString(), '<foo><bar/></foo>')
  const bar = doc.root.get(new XPath('bar'))
  t.is(bar[0].toString(), '<bar/>')
})

test('error', t => {
  t.throws(() => new XPath())
  t.throws(() => new XPath('/$'))
  try {
    const x = new XPath('/$')
    t.fail(x)
  } catch (e) {
    t.truthy(e.constructor.name, 'XPathSyntaxError')
    t.is(util.inspect(e),
      'Error: Syntax error in "/$": Expected end of input but "$" found.')
    t.is(util.inspect(e, {colors: true}),
      'Error: /\u001b[31m$\u001b[39m')
  }
  t.throws(() => {
    const doc = xml`<foo/>`
    doc.get([12])
  })
})
