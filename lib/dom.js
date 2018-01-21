'use strict'

const util = require('util')
const XPath = require('./xpath')

const TOSTRING_OPTS = {
  depth: null,
  colors: false
}

const ATTRIBUTE = Symbol('ATTRIBUTE')
const NAME = Symbol('NAME')
const PUNCTUATION = Symbol('PUNCTUATION')
const TEXT = Symbol('TEXT')
const CLASS = Symbol('CLASS')

const DOM_COLORS = [
  [ATTRIBUTE, 'green'],
  [CLASS, 'red'],
  [NAME, 'green'],
  [PUNCTUATION, 'bold'],
  [TEXT, 'magenta']
]
for (const [style, color] of DOM_COLORS) {
  util.inspect.styles[style] = color
}

function color (str, type, options) {
  if (options.colors && options.stylize) {
    return options.stylize(str, type)
  }
  return str
}

class Node {
  constructor () {
    this.parent = null
  }
  /* istanbul ignore next */
  toString (options = TOSTRING_OPTS) {
    throw new Error('toString() is abstract')
  }
  [util.inspect.custom] (depth, options) {
    const opts = Object.assign({}, options, {depth})
    return `[${color(this.constructor.name, CLASS, opts)} ${this.toString(opts)}]`
  }
  get (pattern, context) {
    return new XPath(pattern).execute(context || this)
  }
  first (pattern, context) {
    const res = this.get(pattern, context)
    if (res.length === 0) {
      return null
    }
    return res[0]
  }
  get document () {
    let cur = this
    while (cur.parent) {
      cur = cur.parent
    }
    if (cur instanceof Document) {
      return cur
    }
    return null
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
  text () {
    return this.children.reduce((p, v) => {
      if (v.text) {
        p += v.text()
      }
      return p
    }, '')
  }
  [Symbol.iterator] () {
    return this.children[Symbol.iterator]()
  }
  * descendants () {
    for (const c of this.children) {
      yield c
      if (typeof c.descendants === 'function') {
        yield * c.descendants()
      }
    }
  }
  * descendantElements () {
    for (const c of this.children) {
      if (c instanceof Element) {
        yield c
        yield * c.descendantElements()
      }
    }
  }
  * elements (local, ns) {
    for (const c of this.children) {
      if ((c instanceof Element) &&
          (!ns || (ns === c.name.ns)) &&
          (!local || (local === c.name.local))) {
        yield c
      }
    }
  }
  toString (options = TOSTRING_OPTS) {
    if (options.depth === 0) {
      return color('...', TEXT, options)
    }
    options = Object.assign({}, options, {
      depth: (options.depth == null) ? null : options.depth - 1
    })
    return this.children.map(c => c.toString(options)).join('')
  }
}
exports.ParentNode = ParentNode

class Document extends ParentNode {
  constructor () {
    super(null)
  }
  get root () {
    return this.children.find(c => c instanceof Element)
  }
  get (pattern, context) {
    return super.get(pattern, context || this.root)
  }
  first (pattern, context) {
    return super.first(pattern, context || this.root)
  }
}
exports.Document = Document

class Element extends ParentNode {
  constructor (name, attribs = [], ns = []) {
    super()
    this.name = (typeof name === 'string') ? {local: name} : name
    this.att = attribs.map(([n, v]) => new Attribute(n, v))
    this.ns = ns.map(([prefix, uri]) => new Namespace(prefix, uri))
    this.children = []
  }
  attribute (local, ns) {
    return this.att.find(a => {
      return ((!ns || (ns === a.name.ns)) && (local === a.name.local))
    })
  }
  setAttribute (name, value) {
    if (typeof name === 'string') {
      name = {local: name}
    }
    let a = this.attribute(name.local, name.ns)
    if (a) {
      a.value = value
    } else {
      a = new Attribute(name, value)
      this.att.push(a)
    }
    return a
  }
  element (local, ns) {
    return this.children.find(e => {
      return (e instanceof Element) &&
             (!ns || (ns === e.name.ns)) &&
             (local === e.name.local)
    })
  }
  toString (options = TOSTRING_OPTS) {
    let ret = color('<', PUNCTUATION, options)
    if (this.name.prefix) {
      ret += color(this.name.prefix, NAME, options)
      ret += color(':', PUNCTUATION, options)
    }
    ret += color(this.name.local, NAME, options) +
      this.ns.map(n => n.toString(options)).join('') +
      this.att.map(a => a.toString(options)).join('')
    if (this.children.length > 0) {
      ret += color('>', PUNCTUATION, options)
      ret += super.toString(options)
      ret += color('</', PUNCTUATION, options)
      if (this.name.prefix) {
        ret += color(this.name.prefix, NAME, options)
        ret += color(':', PUNCTUATION, options)
      }
      ret += color(this.name.local, NAME, options)
      ret += color('>', PUNCTUATION, options)
    } else {
      ret += color('/>', PUNCTUATION, options)
    }
    return ret
  }
}
exports.Element = Element

class Namespace extends Node {
  constructor (prefix, uri) {
    super()
    this.prefix = prefix
    this.uri = uri
  }
  toString (options = TOSTRING_OPTS) {
    let ret = ' ' + color('xmlns', NAME, options)
    if (this.prefix) {
      ret += color(':', PUNCTUATION, options)
      ret += color(this.prefix, NAME, options)
    }
    ret += color('="', PUNCTUATION, options)
    ret += color(this.uri, TEXT, options)
    ret += color('"', PUNCTUATION, options)
    return ret
  }
}
exports.Namespace = Namespace

class Attribute extends Node {
  constructor (name, value) {
    super()
    if (typeof name === 'string') {
      this.name = { local: name }
    } else {
      this.name = name
    }
    this.value = value
  }
  text () {
    return this.value
  }
  toString (options = TOSTRING_OPTS) {
    let ret = ' '
    if (this.name.prefix) {
      ret += color(this.name.prefix, NAME, options)
      ret += color(':', PUNCTUATION, options)
    }
    ret += color(this.name.local, NAME, options)
    ret += color('="', PUNCTUATION, options)
    ret += color(Node.escape(this.value, true), TEXT, options)
    ret += color('"', PUNCTUATION, options)
    return ret
  }
}
exports.Attribute = Attribute

class Text extends Node {
  constructor (txt) {
    super()
    this.txt = txt
  }
  text () {
    return this.txt
  }
  toString (options = TOSTRING_OPTS) {
    if (this.parent instanceof CdataSection) {
      return color(this.txt, TEXT, options)
    }
    return color(Node.escape(this.txt), TEXT, options)
  }
}
exports.Text = Text

class Comment extends Node {
  constructor (txt) {
    super()
    this.txt = txt
  }
  toString (options = TOSTRING_OPTS) {
    let ret = color('<!--', PUNCTUATION, options)
    ret += color(this.txt, TEXT, options)
    ret += color('-->', PUNCTUATION, options)
    return ret
  }
}
exports.Comment = Comment

class CdataSection extends ParentNode {
  toString (options = TOSTRING_OPTS) {
    let ret = color('<![CDATA[', PUNCTUATION, options)
    ret += super.toString(options)
    ret += color(']]>', PUNCTUATION, options)
    return ret
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
  toString (options = TOSTRING_OPTS) {
    let ret = color('<?', PUNCTUATION, options)
    ret += color('xml version', NAME, options)
    ret += color('="', PUNCTUATION, options)
    ret += color(this.version, TEXT, options)
    ret += color('"', PUNCTUATION, options)
    if (this.encoding) {
      ret += ' '
      ret += color('encoding', NAME, options)
      ret += color('="', PUNCTUATION, options)
      ret += color(this.encoding, TEXT, options)
      ret += color('"', PUNCTUATION, options)
    }
    if (!this.standalone) {
      ret += ' '
      ret += color('standalone', NAME, options)
      ret += color('="', PUNCTUATION, options)
      ret += color('no', TEXT, options)
      ret += color('"', PUNCTUATION, options)
    }
    ret += color('?>\n', PUNCTUATION, options)
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
  toString (options = TOSTRING_OPTS) {
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
  toString (options = TOSTRING_OPTS) {
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
  toString (options = TOSTRING_OPTS) {
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
  toString (options = TOSTRING_OPTS) {
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
  toString (options = TOSTRING_OPTS) {
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
  toString (options = TOSTRING_OPTS) {
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
  toString (options = TOSTRING_OPTS) {
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
