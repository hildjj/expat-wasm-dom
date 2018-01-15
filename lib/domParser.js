'use strict'

const {XmlParser} = require('expat-wasm')
const dom = require('./dom')
const INTERNAL = Symbol('InternalOnly')

module.exports = class DomParser {
  static async create () {
    const p = await XmlParser.create()
    return new DomParser(INTERNAL, p)
  }

  static async parseFull (txt) {
    const p = await this.create()
    try {
      const ret = p.parse(txt)
      return ret
    } finally {
      p.destroy()
    }
  }

  constructor (_internalOnly, parser) {
    if (_internalOnly !== INTERNAL) {
      throw new Error('Please call create')
    }
    this.parser = parser
    this.document = new dom.Document()
    this.cur = this.document
    this.lastElName = null
    this.pendingNS = []

    this.parser.on('startNamespaceDecl', (prefix, uri) => {
      this.pendingNS.push([prefix, uri])
    })
    this.parser.on('startElement', (nm, at) => {
      const el = new dom.Element(
        this.parser.triple(nm),
        Object.entries(at).map(([k, v]) => [this.parser.triple(k), v]),
        this.pendingNS)
      this.pendingNS = []
      this.cur.add(el)
      this.cur = el
    })
    this.parser.on('endElement', () => {
      this.cur = this.cur.parent
    })
    this.parser.on('characterData', txt => {
      this.cur.add(new dom.Text(txt))
    })
    this.parser.on('comment', txt => {
      this.cur.add(new dom.Comment(txt))
    })
    this.parser.on('startCdataSection', () => {
      const cdata = new dom.CdataSection()
      this.cur.add(cdata)
      this.cur = cdata
    })
    this.parser.on('endCdataSection', () => {
      this.cur = this.cur.parent
    })
    this.parser.on('xmlDecl', (version, encoding, standalone) => {
      this.cur.add(new dom.XmlDeclaration(version, encoding, standalone))
    })
    this.parser.on('processingInstruction', (target, data) => {
      this.cur.add(new dom.ProcessingInstruction(target, data))
    })
    this.parser.on('startDoctypeDecl', (doctypeName, sysid, pubid, hasInternalSubset) => {
      const decl = new dom.DoctypeDecl(doctypeName, sysid, pubid, hasInternalSubset)
      this.cur.add(decl)
      this.cur = decl
    })
    this.parser.on('endDoctypeDecl', () => {
      this._clearAttlist()
      this.cur = this.cur.parent
    })
    this.parser.on('entityDecl', (...args) => {
      this._clearAttlist()
      this.cur.add(new dom.Entity(...args))
    })
    this.parser.on('notationDecl', (...args) => {
      this._clearAttlist()
      this.cur.add(new dom.Notation(...args))
    })
    this.parser.on('elementDecl', (name, model) => {
      this._clearAttlist()
      this.cur.add(new dom.ElementDecl(name, model))
    })
    this.parser.on('attlistDecl', (elname, ...args) => {
      if (this.lastElName !== elname) {
        this._clearAttlist()
        const al = new dom.Attlist(elname)
        this.cur.add(al)
        this.cur = al
        this.lastElName = elname
      }
      this.cur.add(new dom.AttlistDecl(...args))
    })
  }
  _clearAttlist () {
    if (this.cur instanceof dom.Attlist) {
      this.cur = this.cur.parent
      this.lastElName = null
    }
  }
  parse (str, final = 1) {
    const res = this.parser.parse(str, final)
    if ((final === 1) && (res === 1)) {
      return this.document
    }
    return undefined
  }
  destroy () {
    this.parser.destroy()
    delete this.parser
  }
}
