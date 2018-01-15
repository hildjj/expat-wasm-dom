'use strict'

class Node {
  constructor () {
    this.parent = null
  }
  toString () {
    return ''
  }
  static escape (str, attrib = false) {
    const re = attrib ? /[<&"]/g : /[<&]/g
    return str.replace(re, c => {
      switch (c) {
        case '<': return '&lt;'
        case '&': return '&amp;'
        case '"': return '&quot;'
      }
    })
  }
}
exports.Node = Node

class ParentNode extends Node {
  constructor () {
    super()
    this.children = []
  }
  add (node) {
    node.parent = this
    this.children.push(node)
  }
  toString () {
    return this.children.map(c => c.toString()).join('')
  }
}

class Document extends ParentNode {
  constructor () {
    super(null)
  }
  get root () {
    return this.children.find(c => c instanceof Element)
  }
}
exports.Document = Document

class Element extends ParentNode {
  constructor (name, attribs = [], ns = []) {
    super()
    this.name = (typeof name === 'string') ? {local: name} : name
    this.att = attribs
    this.children = []
    this.ns = ns
  }
  attribute (local, ns) {
    const a = this.att.find(([n]) => {
      return ((!ns || (ns === n.ns)) && (local === n.local))
    })
    return a ? a[1] : null
  }
  element (local, ns) {
    return this.children.find(e => {
      return (e instanceof Element) &&
             (!ns || (ns === e.name.ns)) &&
             (local === e.name.local)
    })
  }

  toString () {
    let ret = '<'
    if (this.name.prefix) {
      ret += `${this.name.prefix}:`
    }
    ret += this.name.local
    for (const [prefix, uri] of this.ns) {
      if (prefix) {
        ret += ` xmlns:${prefix}="${uri}"`
      } else {
        ret += ` xmlns="${uri}"`
      }
    }
    for (const [k, v] of this.att) {
      ret += ' '
      if (k.prefix) {
        ret += `${k.prefix}:`
      }
      ret += `${k.local}="${Node.escape(v, true)}"`
    }
    if (this.children.length > 0) {
      ret += `>${super.toString()}</`
      if (this.name.prefix) {
        ret += `${this.name.prefix}:`
      }
      ret += `${this.name.local}>`
    } else {
      ret += '/>'
    }
    return ret
  }
}
exports.Element = Element

class Text extends Node {
  constructor (txt) {
    super()
    this.text = txt
  }
  toString () {
    if (this.parent instanceof CdataSection) {
      return this.text
    }
    return Node.escape(this.text)
  }
}
exports.Text = Text

class Comment extends Node {
  constructor (txt) {
    super()
    this.text = txt
  }
  toString () {
    return `<!--${this.text}-->`
  }
}
exports.Comment = Comment

class CdataSection extends ParentNode {
  toString () {
    return `<![CDATA[${super.toString()}]]>`
  }
}
exports.CdataSection = CdataSection

class XmlDeclartion extends Node {
  constructor (version, encoding, standalone) {
    super()
    this.version = version
    this.encoding = encoding
    this.standalone = standalone
  }
  toString () {
    let ret = `<?xml version="${this.version}"`
    if (this.encoding) {
      ret += ` encoding="${this.encoding}"`
    }
    if (!this.standalone) {
      ret += ' standalone="no"'
    }
    ret += `?>\n`
    return ret
  }
}
exports.XmlDeclaration = XmlDeclartion

class ProcessingInstruction extends Node {
  constructor (target, data) {
    super()
    this.target = target
    this.data = data
  }
  toString () {
    return `<?${this.target} ${this.data}?>\n`
  }
}
exports.ProcessingInstruction = ProcessingInstruction

class DoctypeDecl extends ParentNode {
  constructor (doctypeName, sysid, pubid, hasInternalSubset) {
    super()
    this.doctypeName = doctypeName
    this.sysid = sysid
    this.pubid = pubid
    this.hasInternalSubset = hasInternalSubset
  }
  toString () {
    let ret = `<!DOCTYPE ${this.doctypeName}`
    if (this.sysid) {
      ret += ` SYSTEM ${this.sysid}`
    }
    if (this.pubid) {
      ret += ` PUBLIC ${this.pubid}`
    }
    if (this.children.length > 0) {
      ret += ` [${super.toString()}\n]`
    }
    ret += `>\n`
    return ret
  }
}
exports.DoctypeDecl = DoctypeDecl

class Entity extends Node {
  constructor (entityName, isParameterEntity, value, base, systemId, publicId, notationName) {
    super()
    this.entityName = entityName
    this.isParameterEntity = isParameterEntity
    this.value = value
    this.base = base
    this.systemId = systemId
    this.publicId = publicId
    this.notationName = notationName
  }
  toString () {
    let ret = `\n  <!ENTITY `
    if (this.isParameterEntity) {
      ret += '% '
    }
    ret += this.entityName
    if (this.value != null) {
      ret += ` "${this.value}"`
    }
    if (this.systemId) {
      ret += ` SYSTEM "${this.systemId}"`
    }
    if (this.publicId) {
      ret += ` PUBLIC "${this.publicId}"`
    }
    if (this.notationName) {
      ret += ` NDATA ${this.notationName}`
    }
    ret += '>'
    return ret
  }
}
exports.Entity = Entity

class Notation extends Node {
  constructor (notationName, base, systemId, publicId) {
    super()
    this.notationName = notationName
    this.base = base
    this.systemId = systemId
    this.publicId = publicId
  }
  toString () {
    let ret = `\n  <!NOTATION ${this.notationName}`
    if (this.systemId) {
      ret += ` SYSTEM "${this.systemId}"`
    }
    if (this.publicId) {
      ret += ` PUBLIC "${this.publicId}"`
    }
    ret += '>'
    return ret
  }
}
exports.Notation = Notation

class ElementDecl extends Node {
  constructor (name, model) {
    super()
    this.name = name
    this.model = model
  }
  _childString (c) {
    let ret = c.name
    switch (c.quant) {
      case 0:
        break
      case 1:
        ret += '?'
        break
      case 2:
        ret += '*'
        break
      case 3:
        ret += '+'
    }
    return ret
  }
  toString () {
    let ret = `\n  <!ELEMENT ${this.name}`
    switch (this.model.type) {
      case 1:
        ret += ' EMPTY'
        break
      case 2:
        ret += ' ANY'
        break
      case 3:
        ret += ' (#PCDATA)'
        break
      case 4:
        throw new Error('Invalid')
      case 5:
        ret += ` (${this.model.children.map(c => this._childString(c)).join('|')})`
        break
      case 6:
        ret += ` (${this.model.children.map(c => this._childString(c)).join(',')})`
        break
    }
    ret += '>'
    return ret
  }
}
exports.ElementDecl = ElementDecl

class Attlist extends ParentNode {
  constructor (elname) {
    super()
    this.elname = elname
  }
  toString () {
    let ret = `\n  <!ATTLIST ${this.elname}`
    if (this.children.length === 1) {
      ret += ' ' + this.children[0].toString()
    } else {
      ret += '\n    '
      ret += this.children.map(c => c.toString()).join('\n    ')
    }
    ret += '>'
    return ret
  }
}
exports.Attlist = Attlist

class AttlistDecl extends Node {
  constructor (attname, attType, dflt, isrequired) {
    super()
    this.attname = attname
    this.attType = attType
    this.dflt = dflt
    this.isrequired = isrequired
  }
  toString () {
    // This is not really ideal, but NOTATION-type attlists aren't handled
    // terribly gracefully by expat, which remvoes whitespace.
    let ret = `${this.attname} ${this.attType.replace(/^NOTATION/, 'NOTATION ')}`
    if (this.dflt) {
      if (this.isrequired) {
        ret += ' #FIXED'
      }
      ret += ` "${this.dflt}"`
    } else {
      if (this.isrequired) {
        ret += ' #REQUIRED'
      } else {
        ret += ' #IMPLIED'
      }
    }
    return ret
  }
}
exports.AttlistDecl = AttlistDecl
