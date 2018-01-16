'use strict'

const util = require('util')
const test = require('ava')
const dom = require('../lib/dom')

test('element', t => {
  const e = new dom.Element('foo')
  t.truthy(e)
  t.is(e.toString(), '<foo/>')
  e.att = [ [{local: 'a'}, 'b'] ]
  t.is(e.toString(), '<foo a="b"/>')
  t.is(e.attribute('a'), 'b')
  t.is(e.document, null)
  t.is(e.first('/'), null)
})

test('escape', t => {
  const e = new dom.Element({local: 'foo', ns: 'urn:foo', prefix: 'f'}, [
    [{local: 'a'}, '"'],
    [{ns: 'urn:foo', local: 'b', prefix: 'f'}, 'no']], [
      ['f', 'urn:foo']
    ])
  e.add(new dom.Text('&<>'))
  const txt = '<f:foo xmlns:f="urn:foo" a="&quot;" f:b="no">&amp;&lt;></f:foo>'
  t.is(e.toString(), txt)
  t.is(util.inspect(e), txt)
  t.is(e.text(), '&<>')
  // iterator
  const children = [...e]
  t.is(children.length, 1)
  t.truthy(children[0] instanceof dom.Text)
})
