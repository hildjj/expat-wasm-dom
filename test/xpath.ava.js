'use strict'

const test = require('ava')
const {DomParser, XPath} = require('../')

test('get', async t => {
  const doc = await DomParser.parseFull(`<foo>
  <bar loo='nod'>No Never</bar>
  <bar loo='bod' load='heavy'><doo first='yes'/></bar>
  <too toad='sprocket' xmlns:c='urn:c' c:too='oot'/>
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
  t.deepEqual(doc.get('/foo/bar[2]').map(e => e.toString()),
              ['<bar loo="bod" load="heavy"><doo first="yes"/></bar>'])
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
})

test('error', t => {
  t.throws(() => new XPath())
  t.throws(() => new XPath('/$'))
})
