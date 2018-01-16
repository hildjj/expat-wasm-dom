'use strict'

const test = require('ava')
const DomParser = require('../lib/domParser')
const dom = require('../lib/dom')

test('create', async t => {
  t.throws(() => new DomParser())
  t.truthy(await DomParser.create())
})

test('parseFull', async t => {
  const doc = await DomParser.parseFull('<foo/>')
  t.truthy(doc)
  t.truthy(doc.root instanceof dom.Element)
  await t.throws(DomParser.parseFull('<fo'))
})

test('attributes', async t => {
  const doc = await DomParser.parseFull('<f a="b" g:h="i" xmlns:g="urn:g"/>')
  t.truthy(doc)
  t.deepEqual(doc.root.attribute('a'), 'b')
  t.deepEqual(doc.root.attribute('h', 'urn:g'), 'i')
})

test('startNamespaceDecl', async t => {
  const doc = await DomParser.parseFull('<f xmlns="urn:f" xmlns:g="urn:g"/>')
  t.truthy(doc)
  t.deepEqual(doc.root.ns, [['', 'urn:f'], ['g', 'urn:g']])
})

test('characterData', async t => {
  const doc = await DomParser.parseFull('<f>goo</f>')
  t.truthy(doc)
  t.is(doc.root.children.length, 1)
  const txt = doc.root.children[0]
  t.truthy(txt instanceof dom.Text)
  t.is(txt.text(), 'goo')
})

test('comment', async t => {
  const doc = await DomParser.parseFull('<f><!--goo&--></f>')
  t.truthy(doc)
  t.is(doc.root.children.length, 1)
  const c = doc.root.children[0]
  t.truthy(c instanceof dom.Comment)
  t.is(c.txt, 'goo&')
})

test('cdata', async t => {
  const doc = await DomParser.parseFull('<f><![CDATA[goo&]]></f>')
  t.truthy(doc)
  t.is(doc.root.children.length, 1)
  const c = doc.root.children[0]
  t.truthy(c instanceof dom.CdataSection)
  t.is(c.children[0].text(), 'goo&')
})

test('xmlDecl', async t => {
  const doc = await DomParser.parseFull('<?xml version="1.0" standalone="no" ?><f/>')
  t.truthy(doc)
  t.truthy(doc.children.length, 2)
  const decl = doc.children[0]
  t.truthy(decl instanceof dom.XmlDeclaration)
  t.is(decl.version, '1.0')
  t.is(decl.encoding, '')
})

test('processingInstruction', async t => {
  const doc = await DomParser.parseFull('<?xml-stylesheet href="mystyle.css" type="text/css"?><f/>')
  t.truthy(doc)
  t.truthy(doc.children.length, 2)
  const pi = doc.children[0]
  t.truthy(pi instanceof dom.ProcessingInstruction)
  t.is(pi.target, 'xml-stylesheet')
  t.is(pi.data, 'href="mystyle.css" type="text/css"')
})

test('dtd', async t => {
  let txt = `<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY js "EcmaScript">
  <!ENTITY short "">
  <!ENTITY logo SYSTEM "images/logo.gif" NDATA gif>
  <!ENTITY % lists "ul | ol">
  <!NOTATION jpeg PUBLIC "JPG 1.0">
  <!ELEMENT foo (bar+)>
  <!ELEMENT bar (#PCDATA)>
  <!ELEMENT empty EMPTY>
  <!ELEMENT any ANY>
  <!ELEMENT parent (empty)>
  <!ELEMENT fruit (apple+|orange?)>
  <!ELEMENT fruits (apple,orange)>
  <!ATTLIST fruit fruitID ID #REQUIRED>
  <!ATTLIST foo
    publisher CDATA #IMPLIED
    reseller CDATA #FIXED "MyStore"
    ISBN ID #REQUIRED
    inPrint (yes|no) "yes">
  <!NOTATION vrml PUBLIC "VRML 1.0">
  <!ATTLIST apple lang NOTATION (vrml) #REQUIRED>
]>
<foo/>`
  const doc = await DomParser.parseFull(txt)
  txt = txt.replace('<foo/>', '<foo reseller="MyStore" inPrint="yes"/>')
  t.is(doc.toString(), txt)
})

test('partial', async t => {
  const p = await DomParser.create()
  t.falsy(p.parse('<foo', 0))
})

test('namespaces', async t => {
  const txt = `<?xml version="1.0" encoding="utf-8" standalone="no"?>
<?xml-stylesheet href="mystyle.css" type="text/css"?>
<foo xmlns="urn:foo" xmlns:b="urn:bar" b:boo="bo">
  <bar a="&quot;'">&amp;&lt;>'</bar>
  <b:bar><![CDATA[&<>'"]]></b:bar>
  <!--&<>'"-->
</foo>`
  const doc = await DomParser.parseFull(txt)
  t.is(doc.toString(), txt)
  const bar = doc.root.element('bar')
  t.truthy(bar)
  t.deepEqual(bar.name, {ns: 'urn:foo', local: 'bar'})
  t.falsy(bar.attribute('moo'))
  const barNS = doc.root.element('bar', 'urn:bar')
  t.truthy(barNS)
  t.falsy(doc.root.element('barb', 'urn:bar'))

  // elements
  let elems = doc.root.elements()
  t.is([...elems].length, 2)
  elems = doc.root.elements('bar', 'urn:foo')
  t.is([...elems].length, 1)
  elems = doc.root.elements('bar', 'urn:bar')
  t.is([...elems].length, 1)
})
