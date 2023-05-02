import * as dom from './dom.js'
import {XmlParser} from 'expat-wasm'

export default class DomParser {
  constructor(encoding, separator) {
    this.parser = new XmlParser(encoding, separator)
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
        this.pendingNS
      )
      this.pendingNS = []
      this.cur.add(el)
      this.cur = el
    })
    this.parser.on('endElement', () => {
      this.cur = this.cur.parent
    })
    this.parser.on('characterData', txt => {
      const last = this.cur.children[this.cur.children.length - 1]
      if (last instanceof dom.Text) {
        last.txt += txt
      } else {
        this.cur.add(new dom.Text(txt))
      }
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
    this.parser.on('xmlDecl', (version, en_coding, standalone) => {
      this.cur.add(new dom.XmlDeclaration(version, en_coding, standalone))
    })
    this.parser.on('processingInstruction', (target, data) => {
      this.cur.add(new dom.ProcessingInstruction(target, data))
    })
    this.parser.on('startDoctypeDecl', (doctypeName, sysid, pubid, hasInternalSubset) => {
      const decl = new dom.DoctypeDecl(
        doctypeName, sysid, pubid, hasInternalSubset
      )
      this.cur.add(decl)
      this.cur = decl
    })
    this.parser.on('endDoctypeDecl', () => {
      this._clearAttlist()
      this.cur = this.cur.parent
    })
    this.parser.on('entityDecl', (...args) => {
      this._clearAttlist()
      this.cur.add(new dom.EntityDecl(...args))
    })
    this.parser.on('notationDecl', (...args) => {
      this._clearAttlist()
      this.cur.add(new dom.NotationDecl(...args))
    })
    this.parser.on('elementDecl', (name, model) => {
      this._clearAttlist()
      this.cur.add(new dom.ElementDecl(name, model))
    })
    this.parser.on('attlistDecl', (elname, ...args) => {
      if (this.lastElName !== elname) {
        this._clearAttlist()
        const al = new dom.AttlistDecl(elname)
        this.cur.add(al)
        this.cur = al
        this.lastElName = elname
      }
      this.cur.add(new dom.AttributeDecl(...args))
    })
  }

  static parseFull(txt) {
    const p = new DomParser()
    // Useful for debug:
    // p.parser.on('*', console.log)
    try {
      const ret = p.parse(txt)
      return ret
    } finally {
      p.destroy()
    }
  }

  static fromString(template, ...sub) {
    const p = new DomParser()
    let last = null
    try {
      last = p.parse(template[0], sub.length > 0 ? 0 : 1)
      for (let i = 0; i < sub.length; i++) {
        p.parse(sub[i].toString(), 0)
        last = p.parse(template[i + 1], (i === sub.length - 1) ? 1 : 0)
      }
      return last
    } finally {
      p.destroy()
    }
  }

  _clearAttlist() {
    if (this.cur instanceof dom.AttlistDecl) {
      this.cur = this.cur.parent
      this.lastElName = null
    }
  }

  parse(str, final = 1) {
    const res = this.parser.parse(str, final)
    if ((final === 1) && (res === 1)) {
      return this.document
    }
    return undefined
  }

  destroy() {
    this.parser.destroy()
    delete this.parser
  }
}
