'use strict'

const test = require('ava')
const dom = require('../lib/dom')

test('element', t => {
  const e = new dom.Element('foo')
  t.truthy(e)
  t.is(e.toString(), '<foo/>')
  e.att = [ [{local: 'a'}, 'b'] ]
  t.is(e.toString(), '<foo a="b"/>')
  t.is(e.attribute('a'), 'b')
})

test('escape', t => {
  const e = new dom.Element({local: 'foo', ns: 'urn:foo', prefix: 'f'}, [
    [{local: 'a'}, '"'],
    [{ns: 'urn:foo', local: 'b', prefix: 'f'}, 'no']], [
      ['f', 'urn:foo']
    ])
  e.add(new dom.Text('&<>'))
  t.is(e.toString(), '<f:foo xmlns:f="urn:foo" a="&quot;" f:b="no">&amp;&lt;></f:foo>')
})
