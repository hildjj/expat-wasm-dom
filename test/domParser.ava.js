import {DomParser, dom} from '../lib/index.js'
import test from 'ava'

test('create', t => {
  const p = new DomParser()
  t.truthy(p)
  p.destroy()
  t.throws(() => p.parse('<foo/>'))

  t.throws(() => new DomParser({
    xmlBase: true,
  }))
})

test('parseFull', t => {
  const doc = DomParser.parseFull('<foo/>')
  t.truthy(doc)
  t.truthy(doc.root instanceof dom.Element)
  t.throws(() => DomParser.parseFull('<fo'))
})

test('attributes', t => {
  const doc = DomParser.parseFull('<f a="b" g:h="i" xmlns:g="urn:g"/>')
  t.truthy(doc)
  t.deepEqual(doc.root.attr('a'), 'b')
  t.deepEqual(doc.root.attr('h', 'urn:g'), 'i')
})

test('startNamespaceDecl', t => {
  const doc = DomParser.parseFull('<f xmlns="urn:f" xmlns:g="urn:g"/>')
  t.truthy(doc)
  t.deepEqual(doc.root.ns.map(n => n.toString()),
    [' xmlns="urn:f"', ' xmlns:g="urn:g"'])
})

test('characterData', t => {
  const doc = DomParser.parseFull('<f>goo</f>')
  t.truthy(doc)
  t.is(doc.root.children.length, 1)
  const [txt] = doc.root.children
  t.truthy(txt instanceof dom.Text)
  t.is(txt.text(), 'goo')
})

test('comment', t => {
  const doc = DomParser.parseFull('<f><!--goo&--></f>')
  t.truthy(doc)
  t.is(doc.root.children.length, 1)
  const [c] = doc.root.children
  t.truthy(c instanceof dom.Comment)
  t.is(c.txt, 'goo&')
})

test('cdata', t => {
  const doc = DomParser.parseFull('<f><![CDATA[goo&]]></f>')
  t.truthy(doc)
  t.is(doc.root.children.length, 1)
  const [c] = doc.root.children
  t.truthy(c instanceof dom.CdataSection)
  t.is(c.children[0].text(), 'goo&')
})

test('xmlDecl', t => {
  const doc = DomParser.parseFull('<?xml version="1.0" standalone="no" ?><f/>')
  t.truthy(doc)
  t.is(doc.children.length, 2)
  const [decl] = doc.children
  t.truthy(decl instanceof dom.XmlDeclaration)
  t.is(decl.version, '1.0')
  t.is(decl.encoding, '')
})

test('processingInstruction', t => {
  const doc = DomParser.parseFull(
    '<?xml-stylesheet href="mystyle.css" type="text/css"?><f/>'
  )
  t.truthy(doc)
  t.is(doc.children.length, 2)
  const [pi] = doc.children
  t.truthy(pi instanceof dom.ProcessingInstruction)
  t.is(pi.target, 'xml-stylesheet')
  t.is(pi.data, 'href="mystyle.css" type="text/css"')
})

test('dtd', t => {
  const txt = `<?xml version="1.0"?>
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
  <!ELEMENT fruit (apple+ | orange?)>
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
<foo>&js;</foo>`
  let doc = DomParser.parseFull(txt)
  t.snapshot(doc.toString())

  doc = DomParser.parseFull(txt, {
    expandInternalEntities: false,
  })
  t.snapshot(doc.toString())
})

test('partial', t => {
  const p = new DomParser()
  t.falsy(p.parse('<foo', 0))
})

test('namespaces', t => {
  const txt = `<?xml version="1.0" encoding="utf-8" standalone="no"?>
<?xml-stylesheet href="mystyle.css" type="text/css"?>
<foo xmlns="urn:foo" xmlns:b="urn:bar" b:boo="bo">
  <bar a="&quot;&apos;">&amp;&lt;>'</bar>
  <b:bar><![CDATA[&<>'"]]></b:bar>
  <!--&<>'"-->
</foo>`
  const doc = DomParser.parseFull(txt)
  t.is(doc.toString(), txt)
  const bar = doc.root.element('bar')
  t.truthy(bar)
  t.deepEqual(bar.name, {ns: 'urn:foo', local: 'bar'})
  t.falsy(bar.attr('moo'))
  const barNS = doc.root.element('bar', 'urn:bar')
  t.truthy(barNS)
  t.falsy(doc.root.element('barb', 'urn:bar'))

  // Elements
  let elems = doc.root.elements()
  t.is([...elems].length, 2)
  elems = doc.root.elements('bar', 'urn:foo')
  t.is([...elems].length, 1)
  elems = doc.root.elements('bar', 'urn:bar')
  t.is([...elems].length, 1)
})

test('tagged literal', t => {
  let d = DomParser.fromString`<foo/>`
  t.is(d.toString(), '<foo/>')
  d = DomParser.fromString`<foo>${12}</foo${'>'}`
  t.is(d.toString(), '<foo>12</foo>')
})

test('systemEntity', t => {
  const doc = DomParser.parseFull(`\
<!DOCTYPE js SYSTEM 'js.dtd'>
<foo>&js;</foo>
`, {
    expandInternalEntities: false,
    systemEntity() {
      return {
        base: 'js',
        data: '<!ENTITY js "EcmaScript">\n',
      }
    },
  })
  t.snapshot(doc.toString())
})
