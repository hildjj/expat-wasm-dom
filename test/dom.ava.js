'use strict'

const util = require('util')
const test = require('ava')
const dom = require('../lib/dom')

test('element', t => {
  const e = new dom.Element('foo')
  t.truthy(e)
  t.is(e.toString(), '<foo/>')
  e.setAttribute('a', 'b')
  t.is(e.toString(), '<foo a="b"/>')
  t.is(e.attribute('a').value, 'b')
  e.setAttribute('a', 'c')
  t.is(e.toString(), '<foo a="c"/>')
  e.setAttribute({local: 'b', prefix: 'c', ns: 'urn:c'}, 'd')
  t.is(e.toString(), '<foo a="c" c:b="d"/>')
  t.is(e.document, null)
  t.is(e.first('/'), null)

  const f = new dom.Element('foo', [['a', 'b']])
  t.is(f.toString(), '<foo a="b"/>')
  f.add(new dom.Text('hi!'))
  t.is(f.toString({depth: 0}), '<foo a="b">...</foo>')
  t.is(f.toString({depth: 0, colors: true}), '<foo a="b">...</foo>')
  t.is(util.inspect(f, {depth: 0}), '[Element <foo a="b">...</foo>]')
  t.not(util.inspect(f, {depth: 0, colors: true}), '[Element <foo a="b">...</foo>]')
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
  t.is(util.inspect(e), '[Element ' + txt + ']')
  t.is(e.text(), '&<>')
  // iterator
  const children = [...e]
  t.is(children.length, 1)
  t.truthy(children[0] instanceof dom.Text)
})
