import {dom} from '../lib/index.js'
import test from 'ava'
import util from 'util'

test('Element', t => {
  const e = new dom.Element('foo')
  t.truthy(e)
  t.is(e.toString(), '<foo/>')
  const attr = e.setAttribute('a', 'b')
  t.is(attr.toString(), ' a="b"')
  t.is(e.toString(), '<foo a="b"/>')
  t.is(e.attr('a'), 'b')
  e.setAttribute('a', 'c')
  t.is(e.toString(), '<foo a="c"/>')
  e.setAttribute({local: 'b', prefix: 'c', ns: 'urn:c'}, 'd')
  t.is(e.toString(), '<foo a="c" c:b="d"/>')
  t.is(e.document, null)
  t.is(e.first('/'), null)
  e.removeAttribute('a')
  t.is(e.toString(), '<foo c:b="d"/>')
  e.removeAttribute({local: 'unknown', ns: 'urn:c'})
  t.is(e.toString(), '<foo c:b="d"/>')
  e.removeAttribute({local: 'b', ns: 'urn:unknown'})
  t.is(e.toString(), '<foo c:b="d"/>')
  e.removeAttribute({local: 'b', ns: 'urn:c'})
  t.is(e.toString(), '<foo/>')
  e.removeAttribute({local: 'unknown', ns: 'urn:c'})
  t.is(e.toString(), '<foo/>')

  const f = new dom.Element('foo', [['a', 'b']])
  t.is(f.toString(), '<foo a="b"/>')
  const txt = f.add(new dom.Text('hi!'))
  t.is(txt.toString(), 'hi!')
  t.is(f.toString({depth: 0}), '<foo a="b">...</foo>')
  t.not(f.toString({depth: 0, colors: true}), '<foo a="b">...</foo>')
  t.is(util.inspect(f, {depth: 0}), '{Element <foo a="b">...</foo>}')
  t.not(util.inspect(f, {depth: 0, colors: true}), '{Element <foo a="b">...</foo>}')
})

test('escape', t => {
  const e = new dom.Element({local: 'foo', ns: 'urn:foo', prefix: 'f'}, [
    [{local: 'a'}, '"\''],
    [{ns: 'urn:foo', local: 'b', prefix: 'f'}, 'no'],
  ], [['f', 'urn:foo']])
  e.add(new dom.Text('&<>'))
  const txt = '<f:foo xmlns:f="urn:foo" a="&quot;&apos;" f:b="no">&amp;&lt;></f:foo>'
  t.is(e.toString(), txt)
  t.is(util.inspect(e), `{Element ${txt}}`)
  t.is(e.text(), '&<>')
  // Iterator
  const children = [...e]
  t.is(children.length, 1)
  t.truthy(children[0] instanceof dom.Text)
  e.add(new dom.Element('bar').add(new dom.Element('baz')).parent)
  const baz = e.first('bar/baz')
  t.is([...e.descendants()].length, 3)
  t.truthy(baz.text('nope') instanceof dom.Text)
  const cmt = e.add(new dom.Comment('haha'))
  t.is(cmt.toString(), '<!--haha-->')
  const cdata = e.add(new dom.CdataSection().add(new dom.Text('nod')).parent)
  t.is(cdata.toString(), '<![CDATA[nod]]>')
  t.is([...e.descendants()].length, 7)
  t.is(e.text(), '&<>nopenod')
})

test('Node', t => {
  const d = new dom.Node()
  t.throws(() => d.toString())
})

test('ParentNode', t => {
  const p = new dom.ParentNode()
  t.throws(() => p.text('foo'))
  t.is(p.toString({depth: null}), '')

  // Coalescing text nodes
  const e = new dom.Element('baz')
  e.add(new dom.Text('foo'))
  e.add(new dom.Text('bar'))
  t.is(e.text(), 'foobar')
  t.is(e.children.length, 1)
})

test('Document', t => {
  const doc = new dom.Document()
  t.deepEqual(doc.get('/'), [doc])
  t.deepEqual(doc.first('/'), doc)
})

test('Attribute', t => {
  const a = new dom.Attribute('foo', 'bar')
  t.is(a.text(), 'bar')
  t.is(a.text('boo'), a)
  t.is(a.text(), 'boo')
})

test('Text', t => {
  const txt = new dom.Text('some text')
  t.is(txt.text(), 'some text')
  t.is(txt.text('bar'), txt)
  t.is(txt.text(), 'bar')
})

test('DoctypeDecl', t => {
  let d = new dom.DoctypeDecl('foo', 's', 'p')
  t.is(d.toString(), '<!DOCTYPE foo PUBLIC "p" "s">')
  d = new dom.DoctypeDecl('foo', 's')
  t.is(d.toString(), '<!DOCTYPE foo SYSTEM "s">')
})

test('EntityDecl', t => {
  let e = new dom.EntityDecl('foo', false, 'bar')
  t.is(e.toString(), '<!ENTITY foo "bar">')
  e = new dom.EntityDecl('chap1', false, null, null, 'chap1.xml')
  t.is(e.toString(), '<!ENTITY chap1 SYSTEM "chap1.xml">')
  e = new dom.EntityDecl('foo', null, null, null, null, 'pub')
  t.is(e.toString(), '<!ENTITY foo PUBLIC "pub">')
})

test('NotationDecl', t => {
  const n = new dom.NotationDecl('foo', null, 'sys')
  t.is(n.toString(), '<!NOTATION foo SYSTEM "sys">')
})

test('ElementDecl', t => {
  const e = new dom.ElementDecl('foo', {
    name: 'bar',
    type: dom.XML_CTYPE_MIXED,
    quant: dom.XML_CQUANT_REP,
    children: [
      {type: dom.XML_CTYPE_ANY, quant: dom.XML_CQUANT_NONE},
    ],
  })
  t.is(e.toString(), '<!ELEMENT foo (#PCDATA | ANY)*>')
  t.throws(() => {
    new dom.ElementDecl('foo', {
      name: 'bar',
      type: -1,
      quant: dom.XML_CQUANT_REP,
    }).toString()
  })
  t.throws(() => {
    new dom.ElementDecl('foo', {
      name: 'bar',
      type: dom.XML_CTYPE_EMPTY,
      quant: -1,
    }).toString()
  })
})

test('html', t => {
  const doc = dom.Document.html()
  const img = doc.root.add(new dom.Element('img', {
    autoplay: '',
  }))
  t.truthy(img.setAttribute('autoplay', 'foo'))
  t.is(doc.toString(), '<!DOCTYPE html><html><img autoplay></html>')
  img.add(new dom.Element('br'))
  t.throws(() => doc.toString())
})

