'use strict'

const test = require('ava')
const {dom, DomParser, XPath} = require('../')

test('get', async t => {
  const doc = await DomParser.parseFull(`<foo>
  <bar loo='nod'/>
  <bar loo='bod'>
    <doo first='yes'/>
  </bar>
  <too/>
  <bar/>
  <dar>
    <doo/>
  </dar>
  <bar loo="skip">baz</bar>
  <daz/>
</foo>`)
  t.deepEqual(doc.get('/foo/bar[2]').map(e => e.toString()),
              ['<bar loo="bod"/>'])
  t.is(doc.first('/foo/bar').toString(), '<bar loo="nod"/>')
  t.is(doc.first('/foo/bort'), null)
  t.is(doc.first('doo', doc.root.first('dar')).toString(), '<doo/>')
  t.is(doc.first('/'), doc)
  t.is(doc.first('/foo/bar/@loo/lo'), null)
  t.is(doc.first('/foo/bar/@loo/@lo'), null)
  t.is(doc.first('/boo'), null)
  t.is(doc.first('/foo/bar[@loo="skip"]/text()'), 'baz')
})

test('error', t => {
  t.throws(() => new XPath())
  t.throws(() => new XPath('/////'))
})
