import {XPath} from './xpath.js'
import util from 'util'

const TOSTRING_OPTS = {
  depth: Infinity,
  colors: false,
}

const ATTRIBUTE = Symbol('ATTRIBUTE')
const NAME = Symbol('NAME')
const PUNCTUATION = Symbol('PUNCTUATION')
const TEXT = Symbol('TEXT')
const CLASS = Symbol('CLASS')

const DOM_COLORS = [
  [ATTRIBUTE, 'blue'],
  [CLASS, 'red'],
  [NAME, 'green'],
  [PUNCTUATION, 'bold'],
  [TEXT, 'magenta'],
]
for (const [style, col] of DOM_COLORS) {
  // @ts-ignore
  util.inspect.styles[style] = col
}

// Extracted from node source
/**
 * Wrap a string with ASCII escapes to colorize it.
 *
 * @param {string} str
 * @param {symbol|util.Style} styleType
 * @returns {string}
 * @private
 */
function stylizeWithColor(str, styleType) {
  // @ts-ignore
  const style = util.inspect.styles[styleType]
  if (style !== undefined) {
    const col = util.inspect.colors[style]
    if (!col) {
      return str
    }
    return `\u001b[${col[0]}m${str}\u001b[${col[1]}m`
  }
  return str
}

/**
 * @callback Stylize
 * @param {string} text
 * @param {util.Style} Style
 * @returns {string}
 */

/**
 * @typedef {Partial<util.InspectOptionsStylized>} MaybeStylized
 */

/**
 * @typedef {object} Separated
 * @prop {string} [separator='']
 */

/**
 * @typedef {MaybeStylized & Separated} MaybeStylizedSeparated
 */

/**
 * Colorize a string, if options.colors is true.
 *
 * @param {string} str
 * @param {symbol|util.Style} type
 * @param {MaybeStylized} options
 * @returns {string}
 * @private
 */
function color(str, type, options) {
  if (options.colors) {
    const st = options.stylize || stylizeWithColor
    // @ts-ignore
    return st(str, type)
  }
  return str
}

/**
 * @typedef {object} Pieces
 * @property {string} [pieces.ns] - the namespace URI
 * @property {string} pieces.local - the local name
 * @property {string} [pieces.prefix] - the prefix used for the current name
 */

/**
 * @jsdoc-remove-next-tag
 * @typedef {[Pieces, string]} AttributePair
 */

/**
 * @typedef {object} Model
 * @property {string} name - Name of the model
 * @property {number} type - Empty=1, Any, Mixed, Name, Choice, Seq
 * @property {number} quant - None=0, Optional, Star, Plus
 * @property {Array<Model>} children
 */

/**
 * The base class for all node types.
 * @abstract
 */
export class Node {
  /**
   * Creates an instance of Node.
   */
  constructor() {
    /**
     * @type {Node?}
     */
    this.parent = null
  }

  /**
   * Convert to string.  Overridden by all subclasses.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string
   * @returns {string} The node, converted to a string
   * @abstract
   */
  // eslint-disable-next-line class-methods-use-this
  toString(options = TOSTRING_OPTS) {
    throw new Error('toString() is abstract')
  }

  /**
   * Custom inspection.
   *
   * @param {number} [depth=2] Depth of children to inspect
   * @param {util.InspectOptionsStylized} [options] Other inspection options
   * @returns {string} The formatted string
   */
  [util.inspect.custom](depth, options) {
    /** @type {MaybeStylized} */
    const opts = {...options, depth}
    return `{${color(this.constructor.name, CLASS, opts)} ${this.toString(opts)}}`
  }

  /**
   * Get all of the nodes that match the given XPath pattern, with the given
   * context for XPath execution.
   *
   * @param {string|XPath} pattern The pattern to match
   * @param {Node} [context=this] The context node.  Uses this node as context
   *   if none is provided.
   * @returns {import('./xpath.js').XPathResult} The matching nodes
   */
  get(pattern, context) {
    if (typeof pattern === 'string') {
      return new XPath(pattern).execute(context || this)
    } else if (pattern instanceof XPath) {
      return pattern.execute(context || this)
    }
    throw new TypeError('Pattern must be string or XPath')
  }

  /**
   * Get the first matching node for a given pattern, or null if none exist.
   *
   * @param {string|XPath} pattern The pattern to match
   * @param {Node} [context=this] The context node.  Uses this node as context
   *   if none is provided.
   * @returns {string|Node|null} The first match if one exists
   */
  first(pattern, context) {
    const res = this.get(pattern, context)
    if (res.length === 0) {
      return null
    }
    return res[0]
  }

  /**
   * Find the Document that this node is in, if it is in a Document.
   *
   * @returns {Document|null} The document, if one is found
   * @readonly
   */
  get document() {
    /** @type {Node} */
    let cur = this
    while (cur.parent) {
      cur = cur.parent
    }

    // eslint-disable-next-line no-use-before-define
    if (cur instanceof Document) {
      return cur
    }
    return null
  }

  /**
   * XML escape a string
   *
   * @static
   * @param {string} str The string to escape
   * @param {boolean} [attrib=false] Is the string an attribute value?
   *   (if so, double-quotes are escaped)
   * @returns {string} The escaped string
   */
  static escape(str, attrib = false) {
    const re = attrib ? /[<&"]/g : /[<&]/g
    const ret = str.replace(re, c => {
      switch (c) {
        case '<': return '&lt;'
        case '&': return '&amp;'
        case '"': return '&quot;'
        case "'": return '&apos;'
      }
      return c
    })
    // See: https://www.w3.org/TR/xml/#NT-CharData
    return attrib ? ret : ret.replace(/]]>/g, ']]&gt;')
  }

  /**
   * Default implementation of text returns empty string.
   *
   * @param {string} [newText] New text to insert
   * @returns {string|Node} The concatenated text
   * @abstract
   */
  // eslint-disable-next-line class-methods-use-this -- Abstract
  text(newText) {
    return ''
  }
}

/**
 * Many Node subclasses are potentially parents of other Nodes.  Those
 * classes will derive from this instead of directly from Node, to get
 * the ability to hold children.
 * @abstract
 */
export class ParentNode extends Node {
  /**
   * Creates an instance of ParentNode.
   */
  constructor() {
    super()

    /**
     * @type {Node[]}
     */
    this.children = []
  }

  /**
   * Add a child node.  Side effect: sets the parent of the added node.
   *
   * @param {Node} node The node to add
   * @returns {Node} The added node
   */
  add(node) {
    node.parent = this
    this.children.push(node)
    return node
  }

  /**
   * Gets the text associated with all of the child nodes, concatenated
   * together. This sometimes has surprising results, because of included
   * whitespace.
   *
   * @param {string} [newText] New text to insert.  Invalid on ParentNode
   *   but used for subclasses.
   * @returns {string|Node} The concatenated text
   */
  text(newText) {
    if (newText != null) {
      throw new Error('Invalid set text operation')
    }
    return this.children.reduce((p, v) => p + v.text(), '')
  }

  /**
   * Allow easy iteration over all of the children of this node
   *
   * @returns {Iterator<Node>} The iterator
   */
  [Symbol.iterator]() {
    return this.children[Symbol.iterator]()
  }

  /**
   * Iterate over all of the descendants of this node, to infinite depth, in
   * prefix order.  That is, parents are yielded before their children.
   * @returns {Generator<Node>}
   */
  *descendants() {
    for (const c of this.children) {
      yield c
      if (c instanceof ParentNode) {
        yield *c.descendants()
      }
    }
  }

  /**
   * Iterate over all of the descendants of this node which are Elements,
   * to infinite depth, in prefix order.  That is, parents are yielded before
   * their children.
   * @returns {Generator<Element>}
   */
  *descendantElements() {
    for (const c of this.children) {
      // eslint-disable-next-line no-use-before-define
      if (c instanceof Element) {
        yield c
        yield *c.descendantElements()
      }
    }
  }

  /**
   * Iterate over all of the children of this Node which are Elements and
   * match the given local name and namespace (if specified).
   *
   * @param {string} [local] The localname.  If not given, match elements with
   *   any name
   * @param {string} [ns] The namespace URI to match.  If not given, match
   *   elements with any namespace.
   * @returns {Generator<Element>}
   */
  *elements(local, ns) {
    for (const c of this.children) {
      // eslint-disable-next-line no-use-before-define
      if ((c instanceof Element) &&
          (!ns || (ns === c.name.ns)) &&
          (!local || (local === c.name.local))) {
        yield c
      }
    }
  }

  /**
   * Convert the node to a string containing representations of all of the
   * children of this node.  Override this and call super as needed.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string
   * @returns {string} The node, converted to a string
   */
  toString(options = TOSTRING_OPTS) {
    if (options.depth === 0) {
      return color('...', TEXT, options)
    }
    const sep = options.separator || ''
    options = {
      ...options,
      depth: (options.depth == null) ? null : options.depth - 1,
      separator: '', // Always reset; newline separators should not propagate
    }
    return this.children.map(c => c.toString(options)).join(sep)
  }
}

/**
 * An entire XML document.
 *
 * @extends {ParentNode}
 */
export class Document extends ParentNode {
  /**
   * Creates an instance of Document.
   */
  constructor() {
    super()
  }

  /**
   * The root element of the document.
   *
   * @returns {Element|null} The root element if it exists
   * @readonly
   */
  get root() {
    return /** @type {Element|null} */ (
      // eslint-disable-next-line no-use-before-define
      this.children.find(c => c instanceof Element)
    )
  }

  /**
   * Get all of the nodes that match the given XPath pattern, with the given
   * context for XPath execution.
   *
   * @param {string|XPath} pattern The pattern to match
   * @param {Node} [context=this.root] The context node.  Uses the root element
   *   as context if none is provided.
   * @returns {import('./xpath.js').XPathResult} The matching nodes
   */
  get(pattern, context) {
    return super.get(pattern, context || this.root || undefined)
  }

  /**
   * Get the first matching node for a given pattern, or null if none exist.
   *
   * @param {string|XPath} pattern The pattern to match
   * @param {Node} [context=this.root] The context node.  Uses the root element
   *   as context if none is provided.
   * @returns {string|Node|null} The first match if one exists
   */
  first(pattern, context) {
    return super.first(pattern, context || this.root || undefined)
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string
   * @returns {string} The node, converted to a string
   */
  toString(options = TOSTRING_OPTS) {
    return super.toString({...options, separator: ''})
  }
}

/**
 * XML Element, like <code>&lt;foo/&gt;</code>.
 *
 * @extends {ParentNode}
 */
export class Element extends ParentNode {
  /**
   * Creates an instance of Element.
   *
   * @param {string|Pieces} name If a string, the local name.
   * @param {AttributePair[]} [attribs=[]] List of
   *   name/value pairs for attributes.
   * @param {string[][]} [ns=[]] List of prefix/URI pairs
   *   for namespaces that are declared in this element.
   */
  constructor(name, attribs = [], ns = []) {
    super()
    this.name = (typeof name === 'string') ? {local: name} : name
    // eslint-disable-next-line no-use-before-define
    this.att = attribs.map(([n, v]) => new Attribute(n, v))
    // eslint-disable-next-line no-use-before-define
    this.ns = ns.map(([prefix, uri]) => new Namespace(prefix, uri))
  }

  /**
   * Find an attribute that matches the given local name and namespace.
   *
   * @param {string} local the local name to search for
   * @param {string} [ns] the namespace to search for.  If not given, match
   *   attributes in any namespace.
   * @returns {Attribute|undefined} Attribute, if one that matches is found
   */
  _attribute(local, ns) {
    return this.att.find(a => (
      (!ns || (ns === a.name.ns)) && (local === a.name.local)
    ))
  }

  /**
   * Find the value of an attribute that matches the given local name and
   * namespace.
   *
   * @param {string} local the local name to search for
   * @param {string} [ns] the namespace to search for.  If not given, match
   *   attributes in any namespace.
   * @returns {string|undefined} Attribute, if one that matches is found
   */
  attr(local, ns) {
    return this._attribute(local, ns)?.value
  }

  /**
   * Set an attribute value for an attribute that might or might not exist yet.
   *
   * @param {string|Pieces} name The attribute name to set.  If a string, use
   *   it as a local name in the global namespace.
   * @param {string} value The value to set.
   * @returns {Attribute} the new/modified Attribute
   */
  setAttribute(name, value) {
    if (typeof name === 'string') {
      name = {local: name}
    }
    let a = this._attribute(name.local, name.ns)
    if (a) {
      a.value = value
    } else {
      // eslint-disable-next-line no-use-before-define
      a = new Attribute(name, value)
      this.att.push(a)
    }
    return a
  }

  /**
   * Remove an attribute.
   *
   * @param {string|Pieces} name The name of the attribute to return
   * @returns {Attribute|null} The removed attribute, if one was found
   */
  removeAttribute(name) {
    const nm = (typeof name === 'string') ? {local: name} : name
    let a = null
    this.att = this.att.filter(att => {
      if (att.name.local !== nm.local) {
        return true
      }
      if (nm.ns && (att.name.ns !== nm.ns)) {
        return true
      }
      // Assert: a == null.  It shouldn't be possible to have 2 matches.
      a = att
      return false
    })
    return a
  }

  /**
   * Find a direct child element of the given local name and namespace.
   *
   * @param {string} local The local name to search for
   * @param {string} [ns] The namespace URI.  If none given, match elements
   *   in any namespace.
   * @returns {Element|undefined} The first matching element, if one is found.
   */
  element(local, ns) {
    return /** @type {Element|undefined} */ (
      this.children.find(e => (e instanceof Element) &&
        (!ns || (ns === e.name.ns)) &&
        (local === e.name.local))
    )
  }

  /**
   * Get or set the text contained in this element.  If setting, replaces
   * all other existing children.
   *
   * @param {string} [newText] If given, set the text of the element.
   *   Otherwise, gets all descendant text, concatenated together.
   * @returns {string|Node} Text on set, string on get.
   */
  text(newText) {
    if (newText == null) {
      return super.text()
    }
    // eslint-disable-next-line no-use-before-define
    const t = new Text(newText)
    t.parent = this
    this.children = [t]
    return t
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string
   * @returns {string} The node, converted to a string
   */
  toString(options = TOSTRING_OPTS) {
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
      ret += super.toString(options) // All children
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

/**
 * A prefix/URI combination for a namespace declaration.
 *
 * @class Namespace
 * @extends {Node}
 */
export class Namespace extends Node {
  /**
   * Creates an instance of Namespace.
   *
   * @param {string} prefix The prefix
   * @param {string} uri The URI
   */
  constructor(prefix, uri) {
    super()
    this.prefix = prefix
    this.uri = uri
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string
   * @returns {string} The node, converted to a string
   */
  toString(options = TOSTRING_OPTS) {
    let ret = ` ${color('xmlns', ATTRIBUTE, options)}`
    if (this.prefix) {
      ret += color(':', PUNCTUATION, options)
      ret += color(this.prefix, ATTRIBUTE, options)
    }
    ret += color('="', PUNCTUATION, options)
    ret += color(this.uri, TEXT, options)
    ret += color('"', PUNCTUATION, options)
    return ret
  }
}

/**
 * An attribute of an Element
 *
 * @extends {Node}
 */
export class Attribute extends Node {
  /**
   * Creates an instance of Attribute.
   *
   * @param {string|Pieces} name If a string, the local name.
   * @param {string} value The value
   */
  constructor(name, value) {
    super()
    if (typeof name === 'string') {
      this.name = {local: name}
    } else {
      this.name = name
    }
    this.value = value
  }

  /**
   * Get or set the attribute value.
   *
   * @param {string} [newText]
   * @returns {string|Node} returns this if newText is provided
   */
  text(newText) {
    if (newText != null) {
      this.value = newText
      return this
    }
    return this.value
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string
   * @returns {string} The node, converted to a string
   */
  toString(options = TOSTRING_OPTS) {
    let ret = ' '
    if (this.name.prefix) {
      ret += color(this.name.prefix, ATTRIBUTE, options)
      ret += color(':', PUNCTUATION, options)
    }
    ret += color(this.name.local, ATTRIBUTE, options)
    ret += color('="', PUNCTUATION, options)
    ret += color(Node.escape(this.value, true), TEXT, options)
    ret += color('"', PUNCTUATION, options)
    return ret
  }
}

/**
 * Plain text in an element.
 *
 * @extends {Node}
 */
export class Text extends Node {
  /**
   * Creates an instance of Text.
   *
   * @param {string} txt The unescaped text
   */
  constructor(txt) {
    super()
    this.txt = txt
  }

  /**
   * Get or set the text contained in this node.
   *
   * @param {string} [newText] If given, set the text of the node.
   *   Otherwise, gets the contained text.
   * @returns {string|Node} null on set, string on get.
   */
  text(newText) {
    if (newText == null) {
      return this.txt
    }
    this.txt = newText
    return this
  }

  /**
   * Convert to string.  If not in a CDataSection, escape text.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string
   * @returns {string} The node, converted to a string
   */
  toString(options = TOSTRING_OPTS) {
    // eslint-disable-next-line no-use-before-define
    if (this.parent instanceof CdataSection) {
      // TODO: escape "]]>" ?
      // replace ]]> by ]]]><![CDATA[]>
      return color(this.txt, TEXT, options)
    }
    return color(Node.escape(this.txt), TEXT, options)
  }
}

export class EntityRef extends Text {
  toString(options = TOSTRING_OPTS) {
    // Don't escape.
    return color(this.txt, TEXT, options)
  }
}

/**
 * An XML comment that contains text
 *
 * @extends {Node}
 */
export class Comment extends Node {
  /**
   * Creates an instance of Comment.
   *
   * @param {string} txt The text of the comment
   */
  constructor(txt) {
    super()
    this.txt = txt
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string
   * @returns {string} The node, converted to a string
   */
  toString(options = TOSTRING_OPTS) {
    let ret = color('<!--', PUNCTUATION, options)
    ret += color(this.txt, TEXT, options)
    ret += color('-->', PUNCTUATION, options)
    return ret
  }
}

/**
 * A CDATA section, like <code>&lt;![CDATA[&lt;foo/&gt;]]&gt;</code>.
 *
 * @extends {ParentNode}
 */
export class CdataSection extends ParentNode {
  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string
   * @returns {string} The node, converted to a string
   */
  toString(options = TOSTRING_OPTS) {
    let ret = color('<![CDATA[', PUNCTUATION, options)
    ret += super.toString(options)
    ret += color(']]>', PUNCTUATION, options)
    return ret
  }
}

/**
 * XML Declaration, like <code>&lt;?xml version="1.0"?&gt;</code>
 *
 * @see https://www.w3.org/TR/xml/#NT-XMLDecl
 * @extends {Node}
 */
export class XmlDeclaration extends Node {
  /**
   * Creates an instance of XmlDeclaration.
   *
   * @param {string} [version='1.0'] The XML version of the document
   * @param {string} [encoding]
   * @param {boolean} [standalone]
   */
  constructor(version = '1.0', encoding = undefined, standalone = false) {
    super()
    this.version = version
    this.encoding = encoding
    this.standalone = standalone
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string
   * @returns {string} The node, converted to a string
   */
  toString(options = TOSTRING_OPTS) {
    let ret = color('<?', PUNCTUATION, options)
    ret += color('xml version', NAME, options)
    ret += color('="', PUNCTUATION, options)
    ret += color(this.version, ATTRIBUTE, options)
    ret += color('"', PUNCTUATION, options)
    if (this.encoding) {
      ret += ' '
      ret += color('encoding', NAME, options)
      ret += color('="', PUNCTUATION, options)
      ret += color(this.encoding, ATTRIBUTE, options)
      ret += color('"', PUNCTUATION, options)
    }
    if (!this.standalone) {
      ret += ' '
      ret += color('standalone', NAME, options)
      ret += color('="', PUNCTUATION, options)
      ret += color('no', ATTRIBUTE, options)
      ret += color('"', PUNCTUATION, options)
    }
    ret += color('?>', PUNCTUATION, options)
    return ret
  }
}

/**
 * Processing Instruction, like <code>&lt;?xml-stylesheet href="mystyle.css"
 * type="text/css"?&gt;</code>
 *
 * @see https://www.w3.org/TR/xml/#sec-pi
 * @extends {Node}
 */
export class ProcessingInstruction extends Node {
  /**
   * Creates an instance of ProcessingInstruction.
   *
   * @param {string} target The target.
   * @param {string} [data] any remaining data
   */
  constructor(target, data) {
    super()
    this.target = target
    this.data = data
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string
   * @returns {string} The node, converted to a string
   */
  toString(options = TOSTRING_OPTS) {
    let ret = color('<?', PUNCTUATION, options)
    ret += color(this.target, NAME, options)
    if (this.data) {
      ret += ' '
      ret += color(this.data, TEXT, options)
    }
    ret += color('?>', PUNCTUATION, options)
    return ret
  }
}

// --------- DTD ----------

/**
 * XML DocType, like <code><!DOCTYPE foo []></code>
 *
 * @see https://www.w3.org/TR/xml/#NT-doctypedecl
 * @extends {ParentNode}
 */
export class DoctypeDecl extends ParentNode {
  /**
   * Creates an instance of DoctypeDecl.
   *
   * @param {string} doctypeName
   * @param {string} [sysid]
   * @param {string} [pubid]
   * @param {boolean} [hasInternalSubset]
   */
  constructor(doctypeName, sysid, pubid, hasInternalSubset) {
    super()
    this.doctypeName = doctypeName
    this.sysid = sysid
    this.pubid = pubid
    this.hasInternalSubset = hasInternalSubset
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string
   * @returns {string} The node, converted to a string
   */
  toString(options = TOSTRING_OPTS) {
    let ret = color('<!', PUNCTUATION, options)
    ret += color('DOCTYPE ', NAME, options)
    ret += color(this.doctypeName, TEXT, options)

    if (this.sysid && this.pubid) {
      ret += ' '
      ret += color('PUBLIC ', NAME, options)
      ret += color('"', PUNCTUATION, options)
      ret += color(this.pubid, ATTRIBUTE, options)
      ret += color('" "', PUNCTUATION, options)
      ret += color(this.sysid, ATTRIBUTE, options)
      ret += color('"', PUNCTUATION, options)
    } else if (this.sysid) {
      ret += ' '
      ret += color('SYSTEM ', NAME, options)
      ret += color('"', PUNCTUATION, options)
      ret += color(this.sysid, ATTRIBUTE, options)
      ret += color('"', PUNCTUATION, options)
    }
    if (this.children.length > 0) {
      ret += color(' [', PUNCTUATION, options)
      ret += super.toString({...options, separator: ''})
      ret += color(']', PUNCTUATION, options)
    }
    ret += color('>', PUNCTUATION, options)
    return ret
  }
}

/**
 * Entity declaration.
 *
 * @see https://www.w3.org/TR/xml/#sec-entity-decl
 * @extends {Node}
 */
export class EntityDecl extends Node {
  /**
   * Creates an instance of EntityDecl.
   *
   * @param {string} entityName
   * @param {boolean} isParameterEntity
   * @param {string} value
   * @param {string} base
   * @param {string} systemId
   * @param {string} publicId
   * @param {string} notationName
   */
  // eslint-disable-next-line max-params
  constructor(
    entityName,
    isParameterEntity,
    value,
    base,
    systemId,
    publicId,
    notationName
  ) {
    super()
    this.entityName = entityName
    this.isParameterEntity = isParameterEntity
    this.value = value
    this.base = base
    this.systemId = systemId
    this.publicId = publicId
    this.notationName = notationName
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string
   * @returns {string} The node, converted to a string
   */
  toString(options = TOSTRING_OPTS) {
    let ret = color('<!', PUNCTUATION, options)
    ret += color('ENTITY ', NAME, options)

    if (this.isParameterEntity) {
      ret += color('% ', PUNCTUATION, options)
    }
    ret += color(this.entityName, ATTRIBUTE, options)
    if (this.value != null) {
      ret += color(' "', PUNCTUATION, options)
      ret += color(this.value, TEXT, options)
      ret += color('"', PUNCTUATION, options)
    }
    if (this.systemId) {
      ret += color(' SYSTEM', NAME, options)
      ret += color(' "', PUNCTUATION, options)
      ret += color(this.systemId, TEXT, options)
      ret += color('"', PUNCTUATION, options)
    }
    if (this.publicId) {
      ret += color(' PUBLIC', NAME, options)
      ret += color(' "', PUNCTUATION, options)
      ret += color(this.publicId, TEXT, options)
      ret += color('"', PUNCTUATION, options)
    }
    if (this.notationName) {
      ret += color(' NDATA ', NAME, options)
      ret += color(this.notationName, TEXT, options)
    }
    ret += color('>', PUNCTUATION, options)
    return ret
  }
}

/**
 * Notation declaration
 *
 * @see https://www.w3.org/TR/xml/#Notations
 * @extends {Node}
 */
export class NotationDecl extends Node {
  /**
   * Creates an instance of NotationDecl.
   *
   * @param {string} notationName
   * @param {string} [base] Base URI for resolving
   * @param {string} [systemId]
   * @param {string} [publicId]
   */
  constructor(notationName, base, systemId, publicId) {
    super()
    this.notationName = notationName
    this.base = base
    this.systemId = systemId
    this.publicId = publicId
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string
   * @returns {string} The node, converted to a string
   */
  toString(options = TOSTRING_OPTS) {
    let ret = color('<!', PUNCTUATION, options)
    ret += color('NOTATION ', NAME, options)
    ret += color(this.notationName, ATTRIBUTE, options)
    if (this.systemId) {
      ret += color(' SYSTEM', NAME, options)
      ret += color(' "', PUNCTUATION, options)
      ret += color(this.systemId, TEXT, options)
      ret += color('"', PUNCTUATION, options)
    }
    if (this.publicId) {
      ret += color(' PUBLIC', NAME, options)
      ret += color(' "', PUNCTUATION, options)
      ret += color(this.publicId, TEXT, options)
      ret += color('"', PUNCTUATION, options)
    }
    ret += color('>', PUNCTUATION, options)
    return ret
  }
}

/**
 * Element Declaration
 *
 * @see https://www.w3.org/TR/xml/#NT-elementdecl
 * @extends {Node}
 */
export class ElementDecl extends Node {
  /**
   * Creates an instance of ElementDecl.
   *
   * @param {string} name Element name
   * @param {Model} model All of the child declarations
   */
  constructor(name, model) {
    super()
    this.name = name
    this.model = model
  }

  /**
   *
   * @param {Model} model
   * @param {MaybeStylizedSeparated} options
   * @returns {string}
   * @private
   */
  _modelString(model, options) {
    let ret = ''
    switch (model.type) {
      case 1:
        ret += color('EMPTY', NAME, options)
        break
      case 2:
        ret += color('ANY', NAME, options)
        break
      case 3:
        ret += color('(', PUNCTUATION, options)
        ret += color('#PCDATA', NAME, options)
        if (model.children.length > 0) {
          ret += color(' | ', PUNCTUATION, options)
          ret += model.children.map(c => this._modelString(c, options)).join(color(' | ', PUNCTUATION, options))
        }
        ret += color(')', PUNCTUATION, options)
        break
      case 4:
        ret += color(model.name, TEXT, options)
        break
      case 5:
        ret += color('(', PUNCTUATION, options)
        ret += model.children.map(c => this._modelString(c, options)).join(color(' | ', PUNCTUATION, options))
        ret += color(')', PUNCTUATION, options)
        break
      case 6:
        ret += color('(', PUNCTUATION, options)
        ret += model.children.map(c => this._modelString(c, options)).join(color(',', PUNCTUATION, options))
        ret += color(')', PUNCTUATION, options)
        break
      default:
        throw new Error(`Invalid model type: "${model.type}"`)
    }

    switch (model.quant) {
      case 0:
        break
      case 1:
        ret += color('?', PUNCTUATION, options)
        break
      case 2:
        ret += color('*', PUNCTUATION, options)
        break
      case 3:
        ret += color('+', PUNCTUATION, options)
        break
      default:
        throw new Error(`Invalid model quantifier: "${model.quant}"`)
    }
    return ret
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string
   * @returns {string} The node, converted to a string
   */
  toString(options = TOSTRING_OPTS) {
    let ret = color('<!', PUNCTUATION, options)
    ret += color('ELEMENT ', NAME, options)
    ret += color(this.name, ATTRIBUTE, options)
    ret += ' '
    ret += this._modelString(this.model, options)
    ret += color('>', PUNCTUATION, options)
    return ret
  }
}

/**
 * Attribute list declaration.
 *
 * @see https://www.w3.org/TR/xml/#attdecls
 * @extends {ParentNode}
 */
export class AttlistDecl extends ParentNode {
  /**
   * Create an attribute list declaration
   * @param {string} elname
   */
  constructor(elname) {
    super()
    this.elname = elname
  }

  /**
   * Because the events for AttributeDecl come in strangely, it's hard to
   * tell when the AttlistDecl is done.  Any non-AttributeDecl added is
   * really meant for the enclusing DTD.  This includes Comments and default
   * (usually whitespace) Text items.
   *
   * @param {Node} node The node to add
   * @returns {Node} The added node
   */
  add(node) {
    // eslint-disable-next-line no-use-before-define
    if (node instanceof AttributeDecl || !this.parent) {
      return super.add(node)
    }
    return /** @type {ParentNode} */ (this.parent).add(node)
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string
   * @returns {string} The node, converted to a string
   */
  toString(options = TOSTRING_OPTS) {
    let ret = color('<!', PUNCTUATION, options)
    ret += color('ATTLIST ', NAME, options)
    ret += color(this.elname, TEXT, options)

    if (this.children.length === 1) {
      ret += ' '
      ret += super.toString(options)
    } else {
      const sep = '\n    '
      ret += sep
      ret += super.toString({...options, separator: sep})
    }
    ret += color('>', PUNCTUATION, options)
    return ret
  }
}

/**
 * Attribute definition
 *
 * @see https://www.w3.org/TR/xml/#NT-AttDef
 * @extends {Node}
 */
export class AttributeDecl extends Node {
  /**
   * Creates an instance of AttributeDecl.
   * @param {string} attname
   * @param {string} attType
   * @param {string} dflt
   * @param {boolean} isrequired
   */
  constructor(attname, attType, dflt, isrequired) {
    super()
    this.attname = attname
    this.attType = attType
    this.dflt = dflt
    this.isrequired = isrequired
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string
   * @returns {string} The node, converted to a string
   */
  toString(options = TOSTRING_OPTS) {
    let ret = color(this.attname, ATTRIBUTE, options)
    ret += ' '
    // This is not really ideal, but NOTATION-type attlists aren't handled
    // terribly gracefully by expat, which remvoes whitespace.
    const m = this.attType.match(/^NOTATION(?<notation>.*)/)
    if (m?.groups) {
      ret += color('NOTATION ', NAME, options)
      ret += color(m.groups.notation, TEXT, options)
    } else {
      ret += color(this.attType, TEXT, options)
    }
    if (this.dflt) {
      if (this.isrequired) {
        ret += color(' #FIXED', NAME, options)
      }
      ret += color(' "', PUNCTUATION, options)
      ret += color(this.dflt, TEXT, options)
      ret += color('"', PUNCTUATION, options)
    } else if (this.isrequired) {
      ret += color(' #REQUIRED', NAME, options)
    } else {
      ret += color(' #IMPLIED', NAME, options)
    }
    return ret
  }
}
