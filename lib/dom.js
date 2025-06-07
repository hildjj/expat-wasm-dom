/* eslint-disable max-params */
/* eslint-disable no-use-before-define */
import {
  ATTRIBUTE, CLASS, NAME, PUNCTUATION, TEXT, TOSTRING_OPTS, color, xmlEscape,
} from './colors.js';
import {LineWrap} from '@cto.af/linewrap';
import {XPath} from './xpath.js';

/**
 * @typedef {import('./colors.js').MaybeStylized} MaybeStylized
 */

/**
 * @typedef {import('./colors.js').Separated} Separated
 */

/**
 * @typedef {import('./colors.js').MaybeStylizedSeparated}
 *   MaybeStylizedSeparated
 */

// See:
// https://html.spec.whatwg.org/multipage/syntax.html#elements-2
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

// See:
// https://html.spec.whatwg.org/multipage/indices.html#attributes-3
const BOOLEAN_ATTRIBUTES = new Set([
  'allowfullscreen',
  'alpha',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'formnovalidate',
  'inert',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'selected',
  'shadowrootclonable',
  'shadowrootdelegatesfocus',
  'shadowrootserializable',
  'truespeed',
  'typemustmatch',
]);

/**
 * @typedef {object} Pieces
 * @property {string} [ns] The namespace URI.
 * @property {string} local The local name.
 * @property {string} [prefix] The prefix used for the current name.
 */

/**
 * @typedef {[Pieces, string]} AttributePair
 */

/**
 * @typedef {object} Model
 * @property {string} [name] Name of the model.
 * @property {number} [type] Empty=1, Any, Mixed, Name, Choice, Seq.
 * @property {number} [quant] None=0, Optional, Star, Plus.
 * @property {Array<Model>} [children] Children.
 */

/**
 * The base class for all node types.
 * @abstract
 */
export class Node {
  /**
   * @type {Document|null}
   */
  #document = null;

  /**
   * @type {Node|null}
   */
  parent = null;

  /**
   * Create a node instance.
   * @param {Document|null} [doc] Document this node is in.  May be empty for
   *   fragments.
   */
  constructor(doc) {
    this.#document = doc ?? null;
  }

  get document() {
    return this.#document;
  }

  set document(val) {
    this.#document = val;
  }

  get html() {
    return Boolean(this.#document?.html);
  }

  /**
   * Convert to string.  Overridden by all subclasses.
   *
   * @abstract
   * @param {MaybeStylizedSeparated} [options] How to convert to string?
   * @returns {string} The node, converted to a string.
   */
  // eslint-disable-next-line class-methods-use-this
  toString(options = TOSTRING_OPTS) {
    if (!options.collator) {
      options.collator = TOSTRING_OPTS.collator;
    }
    if (!options.wrap) {
      options.wrap = new LineWrap({
        width: options.width,
        indentChar: options.indentText,
      });
    }
    if (options.pretty) {
      options.compressed = false;
    }
    return '';
  }

  /**
   * Custom inspection for node.
   *
   * @param {number} [depth=2] Depth of children to inspect.
   * @param {import('node:util').InspectOptionsStylized} [options] Other
   *   inspection options.
   * @returns {string} The formatted string.
   */
  [Symbol.for('nodejs.util.inspect.custom')](depth, options) {
    /** @type {MaybeStylized} */
    const opts = {...options, depth};
    return `{${color(this.constructor.name, CLASS, opts)} ${this.toString(opts)}}`;
  }

  /**
   * Get all of the nodes that match the given XPath pattern, with the given
   * context for XPath execution.
   *
   * @param {string|XPath} pattern The pattern to match.
   * @param {Node} [context=this] The context node.  Uses this node as context
   *   if none is provided.
   * @returns {import('./xpath.js').XPathResult} The matching nodes.
   * @throws {TypeError} If not a string or pattern.
   */
  get(pattern, context) {
    if (typeof pattern === 'string') {
      return new XPath(pattern).execute(context || this);
    } else if (pattern instanceof XPath) {
      return pattern.execute(context || this);
    }
    throw new TypeError('Pattern must be string or XPath');
  }

  /**
   * Get the first matching node for a given pattern, or null if none exist.
   *
   * @param {string|XPath} pattern The pattern to match.
   * @param {Node} [context=this] The context node.  Uses this node as context
   *   if none is provided.
   * @returns {string|Node|number|null} The first match if one exists.
   */
  first(pattern, context) {
    const res = this.get(pattern, context);
    if (res.length === 0) {
      return null;
    }
    return res[0];
  }

  /**
   * XML escape a string.
   *
   * @param {string} str The string to escape.
   * @param {boolean} [attrib=false] Is the string an attribute value?
   *   (if so, double-quotes are escaped).
   * @returns {string} The escaped string.
   */
  static escape(str, attrib = false) {
    return xmlEscape(str, attrib);
  }

  /**
   * Default implementation of text returns empty string.
   *
   * @abstract
   * @param {string} [_newText] New text to insert. (Ignored in abstract).
   * @returns {string|Node} The concatenated text.
   */
  // eslint-disable-next-line class-methods-use-this -- Abstract
  text(_newText) {
    return '';
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
   * @param {Document|null} [doc] The document this node belongs to.
   */
  constructor(doc = null) {
    super(doc);

    /**
     * @type {Node[]}
     */
    this.children = [];
  }

  get document() {
    return super.document;
  }

  set document(val) {
    super.document = val;
    this.children.forEach(c => (c.document = val));
  }

  /**
   * Add a child node.  Side effect: sets the parent of the added node.
   *
   * @param {Node} node The node to add.
   * @returns {Node} The added node.
   */
  add(node) {
    if (
      (node instanceof Text) &&
      (this.children.length > 0) &&
      (this.children[this.children.length - 1].constructor === node.constructor)
    ) {
      const prev = this.children[this.children.length - 1];
      // @ts-ignore
      prev.txt += node.txt;
      return prev;
    }

    node.parent = this;
    node.document = this.document;
    this.children.push(node);
    return node;
  }

  /**
   * Gets the text associated with all of the child nodes, concatenated
   * together. This sometimes has surprising results, because of included
   * whitespace.
   *
   * @param {string} [newText] New text to insert.  Invalid on ParentNode
   *   but used for subclasses.
   * @returns {string|Node} The concatenated text.
   * @throws {Error} If newText is specified.  This is half-abstract.
   */
  text(newText) {
    if (newText != null) {
      throw new Error('Invalid set text operation');
    }
    return this.children.reduce((p, v) => p + v.text(), '');
  }

  hasSignificantText() {
    for (const c of this.children) {
      if ((c instanceof Text) && !c.isEmpty()) {
        return true;
      }
    }
    return false;
  }

  hasElement() {
    return this.children.some(c => c instanceof Element);
  }

  /**
   * Allow easy iteration over all of the children of this node.
   *
   * @returns {Iterator<Node>} The iterator.
   */
  [Symbol.iterator]() {
    return this.children[Symbol.iterator]();
  }

  /**
   * Iterate over all of the descendants of this node, to infinite depth, in
   * prefix order.  That is, parents are yielded before their children.
   *
   * @returns {Generator<Node>} All descendants.
   * @yields {Node} Descendant nodes.
   */
  *descendants() {
    for (const c of this.children) {
      yield c;
      if (c instanceof ParentNode) {
        yield *c.descendants();
      }
    }
  }

  /**
   * Iterate over all of the descendants of this node which are Elements,
   * to infinite depth, in prefix order.  That is, parents are yielded before
   * their children.
   *
   * @returns {Generator<Element>} All element descendants.
   * @yields {Element}
   */
  *descendantElements() {
    for (const c of this.children) {
      if (c instanceof Element) {
        yield c;
        yield *c.descendantElements();
      }
    }
  }

  /**
   * Iterate over all of the children of this Node which are Elements and
   * match the given local name and namespace (if specified).
   *
   * @param {string} [local] The localname.  If not given, match elements with
   *   any name.
   * @param {string} [ns] The namespace URI to match.  If not given, match
   *   elements with any namespace.
   * @returns {Generator<Element>} Direct element children.
   * @yields {Element}
   */
  *elements(local, ns) {
    for (const c of this.children) {
      if ((c instanceof Element) &&
          (!ns || (ns === c.name.ns)) &&
          (!local || (local === c.name.local))) {
        yield c;
      }
    }
  }

  /**
   * Convert the node to a string containing representations of all of the
   * children of this node.  Override this and call super as needed.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string.
   * @returns {string} The node, converted to a string.
   */
  toString(options = TOSTRING_OPTS) {
    // Don't call super here because Element calls this too late.
    // Ensure all subclasses that might contain an element call Node.toString()
    // on their options.
    if (options.depth === 0) {
      return color('...', TEXT, options);
    }
    const sep = options.separator || '';
    options = {
      ...options,
      depth: (options.depth == null) ? null : options.depth - 1,
      separator: '', // Always reset; newline separators should not propagate
    };
    return this.children.map(c => c.toString(options)).join(sep);
  }
}

/**
 * An entire XML document.
 *
 * @extends {ParentNode}
 */
export class Document extends ParentNode {
  #html = false;

  /**
   * Creates an instance of Document.
   */
  constructor() {
    super();
    this.document = this;
  }

  get html() {
    return this.#html;
  }

  set html(val) {
    this.#html = val;
  }

  /**
   * The root element of the document.
   *
   * @readonly
   * @returns {Element|null} The root element if it exists.
   */
  get root() {
    return /** @type {Element|null} */ (
      this.children.find(c => c instanceof Element)
    );
  }

  /**
   * Get all of the nodes that match the given XPath pattern, with the given
   * context for XPath execution.
   *
   * @param {string|XPath} pattern The pattern to match.
   * @param {Node} [context=this.root] The context node.  Uses the root element
   *   as context if none is provided.
   * @returns {import('./xpath.js').XPathResult} The matching nodes.
   */
  get(pattern, context) {
    return super.get(pattern, context || this.root || undefined);
  }

  /**
   * Get the first matching node for a given pattern, or null if none exist.
   *
   * @param {string|XPath} pattern The pattern to match.
   * @param {Node} [context=this.root] The context node.  Uses the root element
   *   as context if none is provided.
   * @returns {string|number|Node|null} The first match if one exists.
   */
  first(pattern, context) {
    return super.first(pattern, context || this.root || undefined);
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string.
   * @returns {string} The node, converted to a string.
   */
  toString(options = TOSTRING_OPTS) {
    Node.prototype.toString.call(this, options);
    return super.toString({...options, separator: ''});
  }

  /**
   * Create an empty HTML 5 document with doctype and root element.
   *
   * @returns {Document} Empty document.
   */
  static html() {
    const doc = new Document();
    doc.html = true;
    doc.add(new DoctypeDecl('html'));
    doc.add(new Element('html'));
    return doc;
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
   * @param {AttributePair[]|Record<string,string>} [attribs=[]]
   *   List of name/value pairs for attributes, or options object.
   * @param {string[][]} [ns=[]] List of prefix/URI pairs
   *   for namespaces that are declared in this element.
   * @param {Document|null} [doc] The document this node belongs to.
   */
  constructor(name, attribs = [], ns = [], doc = null) {
    super(doc);

    /** @type {Pieces} */
    this.name = (typeof name === 'string') ? {local: name} : name;

    /** @type {Attribute[]} */
    this.att = Array.isArray(attribs) ?
      attribs.map(([n, v]) => new Attribute(n, v, this.document)) :
      this.att = Object.entries(attribs)
        .map(([k, v]) => new Attribute({local: k}, v, this.document));

    /** @type {Namespace[]} */
    this.ns = ns.map(
      ([prefix, uri]) => new Namespace(prefix, uri, this.document)
    );
  }

  get document() {
    return super.document;
  }

  set document(val) {
    super.document = val;
    this.att.forEach(a => (a.document = val));
    this.ns.forEach(a => (a.document = val));
  }

  /**
   * Find an attribute that matches the given local name and namespace.
   *
   * @param {string} local The local name to search for.
   * @param {string} [ns] The namespace to search for.  If not given, match
   *   attributes in any namespace.
   * @returns {Attribute|undefined} Attribute, if one that matches is found.
   */
  #attribute(local, ns) {
    return this.att.find(a => (
      (!ns || (ns === a.name.ns)) && (local === a.name.local)
    ));
  }

  /**
   * Find the value of an attribute that matches the given local name and
   * namespace.
   *
   * @param {string} local The local name to search for.
   * @param {string} [ns] The namespace to search for.  If not given, match
   *   attributes in any namespace.
   * @returns {string|undefined} Attribute, if one that matches is found.
   */
  attr(local, ns) {
    return this.#attribute(local, ns)?.value;
  }

  /**
   * Set an attribute value for an attribute that might or might not exist yet.
   *
   * @param {string|Pieces} name The attribute name to set.  If a string, use
   *   it as a local name in the global namespace.
   * @param {string} value The value to set.
   * @returns {Attribute} The new/modified Attribute.
   */
  setAttribute(name, value) {
    if (typeof name === 'string') {
      name = {local: name};
    }
    let a = this.#attribute(name.local, name.ns);
    if (a) {
      a.value = value;
    } else {
      a = new Attribute(name, value, this.document);
      a.document = this.document;
      this.att.push(a);
    }
    return a;
  }

  /**
   * Remove an attribute.
   *
   * @param {string|Pieces} name The name of the attribute to return.
   * @returns {Attribute|null} The removed attribute, if one was found.
   */
  removeAttribute(name) {
    const nm = (typeof name === 'string') ? {local: name} : name;
    let a = null;
    this.att = this.att.filter(att => {
      if (att.name.local !== nm.local) {
        return true;
      }
      if (nm.ns && (att.name.ns !== nm.ns)) {
        return true;
      }
      // Assert: a == null.  It shouldn't be possible to have 2 matches.
      a = att;
      return false;
    });
    return a;
  }

  /**
   * Find a direct child element of the given local name and namespace.
   *
   * @param {string} local The local name to search for.
   * @param {string} [ns] The namespace URI.  If none given, match elements
   *   in any namespace.
   * @returns {Element|undefined} The first matching element, if one is found.
   */
  element(local, ns) {
    return /** @type {Element|undefined} */ (
      this.children.find(e => (e instanceof Element) &&
        (!ns || (ns === e.name.ns)) &&
        (local === e.name.local))
    );
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
      return super.text();
    }

    const t = new Text(newText, this.document);
    t.parent = this;

    this.children = [t];
    return t;
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string.
   * @returns {string} The node, converted to a string.
   * @throws {Error} On HTML void elements with children.
   */
  toString(options = TOSTRING_OPTS) {
    Node.prototype.toString.call(this, options);

    let ret = color('<', PUNCTUATION, options);
    if (this.name.prefix) {
      ret += color(this.name.prefix, NAME, options);
      ret += color(':', PUNCTUATION, options);
    }

    if (options.pretty) {
      const col = /** @type {Intl.Collator} */ (options.collator);
      const ns = [...this.ns].sort((a, b) => Namespace.compare(a, b, col));
      const att = [...this.att].sort((a, b) => Attribute.compare(a, b, col));
      // Not implemented yet.
      // if (options.compressed) {
      ret += ns.map(n => n.toString(options)).join('');
      ret += att.map(a => a.toString(options)).join('');
      // } else {

      // }
      if (this.hasSignificantText()) {
        // We're in text-only or mixed mode.
      }
    }

    ret += color(this.name.local, NAME, options);
    ret += this.ns.map(n => n.toString(options)).join('');
    ret += this.att.map(a => a.toString(options)).join('');
    if (this.children.length > 0) {
      if (this.html && VOID_ELEMENTS.has(this.name.local)) {
        throw new Error(`Void element with children: "${this.name.local}"`);
      }
      ret += color('>', PUNCTUATION, options);
      ret += super.toString(options); // All children
      ret += color('</', PUNCTUATION, options);
      if (this.name.prefix) {
        ret += color(this.name.prefix, NAME, options);
        ret += color(':', PUNCTUATION, options);
      }
      ret += color(this.name.local, NAME, options);
      ret += color('>', PUNCTUATION, options);
    } else if (this.html && VOID_ELEMENTS.has(this.name.local)) {
      ret += color('>', PUNCTUATION, options);
    } else {
      ret += color('/>', PUNCTUATION, options);
    }
    return ret;
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
   * @param {string} prefix The prefix.
   * @param {string} uri The URI.
   * @param {Document|null} [doc] The document this node belongs to.
   */
  constructor(prefix, uri, doc = null) {
    super(doc);
    this.prefix = prefix;
    this.uri = uri;
  }

  /**
   * Compare two namespaces for ordering, by prefix.
   *
   * @param {Namespace} a First namespace.
   * @param {Namespace} b Second namespace.
   * @param {Intl.Collator} collator How to compare?
   * @returns {number} -1 if a < b, 1 if a > b, 0 if equan.
   */
  static compare(a, b, collator) {
    // Only one namespace doesn't have a prefix
    if (!a.prefix) {
      return -1;
    }
    if (!b.prefix) {
      return 1;
    }
    return collator.compare(a.prefix, b.prefix);
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string.
   * @returns {string} The node, converted to a string.
   */
  toString(options = TOSTRING_OPTS) {
    super.toString(options);
    let ret = ` ${color('xmlns', ATTRIBUTE, options)}`;
    if (this.prefix) {
      ret += color(':', PUNCTUATION, options);
      ret += color(this.prefix, ATTRIBUTE, options);
    }
    ret += color('="', PUNCTUATION, options);
    ret += color(this.uri, TEXT, options);
    ret += color('"', PUNCTUATION, options);
    return ret;
  }
}

/**
 * An attribute of an Element.
 *
 * @extends {Node}
 */
export class Attribute extends Node {
  /**
   * Creates an instance of Attribute.
   *
   * @param {string|Pieces} name If a string, the local name.
   * @param {string} value The value.
   * @param {Document|null} [doc] The document this node belongs to.
   */
  constructor(name, value, doc = null) {
    super(doc);

    /** @type {Pieces} */
    this.name = (typeof name === 'string') ? {local: name} : name;

    /** @type {string} */
    this.value = value;
  }

  /**
   * Compare two attributes for ordering.
   *
   * @param {Attribute} a First attribute.
   * @param {Attribute} b Second attribute.
   * @param {Intl.Collator} collator How to compare?
   * @returns {number} -1 if a < b.
   */
  static compare(a, b, collator) {
    if (a.name.prefix && b.name.prefix) {
      // Sort by prefix then local
      return collator.compare(a.name.prefix, b.name.prefix) ||
        collator.compare(a.name.local, b.name.local);
    }
    if (a.name.prefix) {
      // Prefixed come before non-prefixed
      return -1;
    }
    if (b.name.prefix) {
      return 1;
    }
    return collator.compare(a.name.local, b.name.local);
  }

  /**
   * Get or set the attribute value.
   *
   * @param {string} [newText] If specified, replace.
   * @returns {string|Node} This if newText is provided, otherwise the
   *   existing text.
   */
  text(newText) {
    if (newText != null) {
      this.value = newText;
      return this;
    }
    return this.value;
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string.
   * @returns {string} The node, converted to a string.
   */
  toString(options = TOSTRING_OPTS) {
    let ret = ' ';
    if (this.name.prefix) {
      ret += color(this.name.prefix, ATTRIBUTE, options);
      ret += color(':', PUNCTUATION, options);
    }
    ret += color(this.name.local, ATTRIBUTE, options);

    if (!this.html || !BOOLEAN_ATTRIBUTES.has(this.name.local)) {
      ret += color('="', PUNCTUATION, options);
      ret += color(Node.escape(this.value, true), TEXT, options);
      ret += color('"', PUNCTUATION, options);
    }
    return ret;
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
   * @param {string} txt The unescaped text.
   * @param {Document|null} [doc] The document this node belongs to.
   */
  constructor(txt, doc = null) {
    super(doc);
    this.txt = txt;
  }

  /**
   * Get or set the text contained in this node.
   *
   * @param {string} [newText] If given, set the text of the node.
   *   Otherwise, gets the contained text.
   * @returns {string|Node} Returns this on set, string on get.
   */
  text(newText) {
    if (newText == null) {
      return this.txt;
    }
    this.txt = newText;
    return this;
  }

  isEmpty() {
    return /^\s*$/.test(this.txt);
  }

  /**
   * Convert to string.  If not in a CDataSection, escape text.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string.
   * @returns {string} The node, converted to a string.
   */
  toString(options = TOSTRING_OPTS) {
    if (this.parent instanceof CdataSection) {
      // TODO: escape "]]>" ?
      // replace ]]> by ]]]><![CDATA[]>
      return color(this.txt, TEXT, options);
    }
    let {txt} = this;
    if (options.compressed) {
      txt = txt.replace(
        LineWrap.DEFAULT_OPTIONS.isNewline,
        LineWrap.DEFAULT_OPTIONS.newlineReplacement
      ).trim();
    }
    return color(Node.escape(txt), TEXT, options);
  }
}

/**
 * Like a Text node, but no escaping is done.  Intended for text like "&foo;"
 * when it's really an entity reference and we're not expanding the reference.
 *
 * @extends {Text}
 */
export class EntityRef extends Text {
  /**
   * Convert to string.  No escaping is performed.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string.
   * @returns {string} The node, converted to a string.
   */
  toString(options = TOSTRING_OPTS) {
    return color(this.txt, TEXT, options);
  }
}

/**
 * An XML comment that contains text.
 *
 * @extends {Node}
 */
export class Comment extends Node {
  /**
   * Creates an instance of Comment.
   *
   * @param {string} txt The text of the comment.
   * @param {Document|null} [doc] The document this node belongs to.
   */
  constructor(txt, doc = null) {
    super(doc);
    this.txt = txt;
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string.
   * @returns {string} The node, converted to a string.
   */
  toString(options = TOSTRING_OPTS) {
    if (options.removeComments) {
      return '';
    }
    let ret = color('<!--', PUNCTUATION, options);
    ret += color(this.txt, TEXT, options);
    ret += color('-->', PUNCTUATION, options);
    return ret;
  }
}

/**
 * A CDATA section, like <code>&lt;![CDATA[&lt;foo/&gt;]]&gt;</code>.
 *
 * @extends {ParentNode}
 */
export class CdataSection extends ParentNode {
  /**
   * Create a CDATA.
   *
   * @param {Document|null} [doc] The document this node belongs to.
   */
  constructor(doc) {
    super(doc);
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string.
   * @returns {string} The node, converted to a string.
   */
  toString(options = TOSTRING_OPTS) {
    let ret = color('<![CDATA[', PUNCTUATION, options);
    ret += super.toString(options);
    ret += color(']]>', PUNCTUATION, options);
    return ret;
  }
}

/**
 * XML Declaration, like <code>&lt;?xml version="1.0"?&gt;</code>.
 *
 * @see https://www.w3.org/TR/xml/#NT-XMLDecl
 */
export class XmlDeclaration extends Node {
  /**
   * Creates an instance of XmlDeclaration.
   *
   * @param {string} [version='1.0'] The XML version of the document.
   * @param {string} [encoding] Encoding name.
   * @param {boolean} [standalone] Is standalone?
   * @param {Document|null} [doc] The document this node belongs to.
   */
  constructor(version = '1.0', encoding = undefined, standalone = false, doc = null) {
    super(doc);
    this.version = version;
    this.encoding = encoding;
    this.standalone = standalone;
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string.
   * @returns {string} The node, converted to a string.
   */
  toString(options = TOSTRING_OPTS) {
    let ret = color('<?', PUNCTUATION, options);
    ret += color('xml version', NAME, options);
    ret += color('="', PUNCTUATION, options);
    ret += color(this.version, ATTRIBUTE, options);
    ret += color('"', PUNCTUATION, options);
    if (this.encoding) {
      ret += ' ';
      ret += color('encoding', NAME, options);
      ret += color('="', PUNCTUATION, options);
      ret += color(this.encoding, ATTRIBUTE, options);
      ret += color('"', PUNCTUATION, options);
    }
    if (!this.standalone) {
      ret += ' ';
      ret += color('standalone', NAME, options);
      ret += color('="', PUNCTUATION, options);
      ret += color('no', ATTRIBUTE, options);
      ret += color('"', PUNCTUATION, options);
    }
    ret += color('?>', PUNCTUATION, options);
    return ret;
  }
}

/**
 * Processing Instruction, like <code>&lt;?xml-stylesheet href="mystyle.css"
 * type="text/css"?&gt;</code>.
 *
 * @see https://www.w3.org/TR/xml/#sec-pi
 */
export class ProcessingInstruction extends Node {
  /**
   * Creates an instance of ProcessingInstruction.
   *
   * @param {string} target The target.
   * @param {string} [data] Any remaining data.
   * @param {Document|null} [doc] The document this node belongs to.
   */
  constructor(target, data, doc) {
    super(doc);
    this.target = target;
    this.data = data;
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string.
   * @returns {string} The node, converted to a string.
   */
  toString(options = TOSTRING_OPTS) {
    let ret = color('<?', PUNCTUATION, options);
    ret += color(this.target, NAME, options);
    if (this.data) {
      ret += ' ';
      ret += color(this.data, TEXT, options);
    }
    ret += color('?>', PUNCTUATION, options);
    return ret;
  }
}

// --------- DTD ----------

/**
 * XML DocType, like <code><!DOCTYPE foo []></code>.
 *
 * @see https://www.w3.org/TR/xml/#NT-doctypedecl
 */
export class DoctypeDecl extends ParentNode {
  /**
   * Creates an instance of DoctypeDecl.
   *
   * @param {string} doctypeName Name.
   * @param {string} [sysid] System ID.
   * @param {string} [pubid] Public ID.
   * @param {boolean} [hasInternalSubset] Internal subset?
   * @param {Document|null} [doc] The document this node belongs to.
   */
  constructor(doctypeName, sysid, pubid, hasInternalSubset, doc = null) {
    super(doc);
    this.doctypeName = doctypeName;
    this.sysid = sysid;
    this.pubid = pubid;
    this.hasInternalSubset = hasInternalSubset;
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string.
   * @returns {string} The node, converted to a string.
   */
  toString(options = TOSTRING_OPTS) {
    let ret = color('<!', PUNCTUATION, options);
    ret += color('DOCTYPE ', NAME, options);
    ret += color(this.doctypeName, TEXT, options);

    if (this.sysid && this.pubid) {
      ret += ' ';
      ret += color('PUBLIC ', NAME, options);
      ret += color('"', PUNCTUATION, options);
      ret += color(this.pubid, ATTRIBUTE, options);
      ret += color('" "', PUNCTUATION, options);
      ret += color(this.sysid, ATTRIBUTE, options);
      ret += color('"', PUNCTUATION, options);
    } else if (this.sysid) {
      ret += ' ';
      ret += color('SYSTEM ', NAME, options);
      ret += color('"', PUNCTUATION, options);
      ret += color(this.sysid, ATTRIBUTE, options);
      ret += color('"', PUNCTUATION, options);
    }
    if (this.children.length > 0) {
      ret += color(' [', PUNCTUATION, options);
      ret += super.toString({...options, separator: ''});
      ret += color(']', PUNCTUATION, options);
    }
    ret += color('>', PUNCTUATION, options);
    return ret;
  }
}

/**
 * Entity declaration.
 *
 * @see https://www.w3.org/TR/xml/#sec-entity-decl
 */
export class EntityDecl extends Node {
  /**
   * Creates an instance of EntityDecl.
   *
   * @param {string} entityName Name.
   * @param {boolean} [isParameterEntity=false] Parameter?
   * @param {string} [value] Value.
   * @param {string} [base] Base URL.
   * @param {string} [systemId] System ID?
   * @param {string} [publicId] Public ID?
   * @param {string} [notationName] Notation.
   * @param {Document|null} [doc] The document this node belongs to.
   */
  constructor(
    entityName,
    isParameterEntity,
    value,
    base,
    systemId,
    publicId,
    notationName,
    doc
  ) {
    super(doc);

    /** @type {string} */
    this.entityName = entityName;

    /** @type {boolean} */
    this.isParameterEntity = Boolean(isParameterEntity);

    /** @type {string|undefined} */
    this.value = value;

    /** @type {string|undefined} */
    this.base = base;

    /** @type {string|undefined} */
    this.systemId = systemId;

    /** @type {string|undefined} */
    this.publicId = publicId;

    /** @type {string|undefined} */
    this.notationName = notationName;
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string.
   * @returns {string} The node, converted to a string.
   */
  toString(options = TOSTRING_OPTS) {
    let ret = color('<!', PUNCTUATION, options);
    ret += color('ENTITY ', NAME, options);

    if (this.isParameterEntity) {
      ret += color('% ', PUNCTUATION, options);
    }
    ret += color(this.entityName, ATTRIBUTE, options);
    if (this.value != null) {
      ret += color(' "', PUNCTUATION, options);
      ret += color(this.value, TEXT, options);
      ret += color('"', PUNCTUATION, options);
    }
    if (this.systemId) {
      ret += color(' SYSTEM', NAME, options);
      ret += color(' "', PUNCTUATION, options);
      ret += color(this.systemId, TEXT, options);
      ret += color('"', PUNCTUATION, options);
    }
    if (this.publicId) {
      ret += color(' PUBLIC', NAME, options);
      ret += color(' "', PUNCTUATION, options);
      ret += color(this.publicId, TEXT, options);
      ret += color('"', PUNCTUATION, options);
    }
    if (this.notationName) {
      ret += color(' NDATA ', NAME, options);
      ret += color(this.notationName, TEXT, options);
    }
    ret += color('>', PUNCTUATION, options);
    return ret;
  }
}

/**
 * Notation declaration.
 *
 * @see https://www.w3.org/TR/xml/#Notations
 */
export class NotationDecl extends Node {
  /**
   * Creates an instance of NotationDecl.
   *
   * @param {string} notationName Notation.
   * @param {string} [base] Base URI for resolving.
   * @param {string} [systemId] System ID.
   * @param {string} [publicId] Public ID.
   * @param {Document|null} [doc] The document this node belongs to.
   */
  constructor(notationName, base, systemId, publicId, doc = null) {
    super(doc);

    /** @type {string} */
    this.notationName = notationName;

    /** @type {string|undefined} */
    this.base = base;

    /** @type {string|undefined} */
    this.systemId = systemId;

    /** @type {string|undefined} */
    this.publicId = publicId;
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string.
   * @returns {string} The node, converted to a string.
   */
  toString(options = TOSTRING_OPTS) {
    let ret = color('<!', PUNCTUATION, options);
    ret += color('NOTATION ', NAME, options);
    ret += color(this.notationName, ATTRIBUTE, options);
    if (this.systemId) {
      ret += color(' SYSTEM', NAME, options);
      ret += color(' "', PUNCTUATION, options);
      ret += color(this.systemId, TEXT, options);
      ret += color('"', PUNCTUATION, options);
    }
    if (this.publicId) {
      ret += color(' PUBLIC', NAME, options);
      ret += color(' "', PUNCTUATION, options);
      ret += color(this.publicId, TEXT, options);
      ret += color('"', PUNCTUATION, options);
    }
    ret += color('>', PUNCTUATION, options);
    return ret;
  }
}

let XML_CTYPE = 1;
export const XML_CTYPE_EMPTY = XML_CTYPE++;
export const XML_CTYPE_ANY = XML_CTYPE++;
export const XML_CTYPE_MIXED = XML_CTYPE++;
export const XML_CTYPE_NAME = XML_CTYPE++;
export const XML_CTYPE_CHOICE = XML_CTYPE++;
export const XML_CTYPE_SEQ = XML_CTYPE++;

let XML_CQUANT = 0;
export const XML_CQUANT_NONE = XML_CQUANT++;
export const XML_CQUANT_OPT = XML_CQUANT++;
export const XML_CQUANT_REP = XML_CQUANT++;
export const XML_CQUANT_PLUS = XML_CQUANT++;

/**
 * Element Declaration.
 *
 * @see https://www.w3.org/TR/xml/#NT-elementdecl
 */
export class ElementDecl extends Node {
  /**
   * Creates an instance of ElementDecl.
   *
   * @param {string} name Element name.
   * @param {Model} [model] All of the child declarations.
   * @param {Document|null} [doc] The document this node belongs to.
   */
  constructor(name, model, doc) {
    super(doc);
    this.name = name;
    this.model = model;
  }

  /**
   * Convert the model to a string.
   *
   * @param {Model} model Model.
   * @param {MaybeStylizedSeparated} options Options.
   * @returns {string} Converted model.
   * @throws {Error} Unknown types.
   */
  #modelString(model, options) {
    let ret = '';
    switch (model.type) {
      case XML_CTYPE_EMPTY:
        ret += color('EMPTY', NAME, options);
        break;
      case XML_CTYPE_ANY:
        ret += color('ANY', NAME, options);
        break;
      case XML_CTYPE_MIXED:
        ret += color('(', PUNCTUATION, options);
        ret += color('#PCDATA', NAME, options);
        if (model.children?.length) {
          ret += color(' | ', PUNCTUATION, options);
          ret += model.children.map(c => this.#modelString(c, options)).join(color(' | ', PUNCTUATION, options));
        }
        ret += color(')', PUNCTUATION, options);
        break;
      case XML_CTYPE_NAME:
        if (model.name) {
          ret += color(model.name, TEXT, options);
        }
        break;
      case XML_CTYPE_CHOICE:
        ret += color('(', PUNCTUATION, options);
        if (model.children?.length) {
          ret += model.children.map(c => this.#modelString(c, options)).join(color(' | ', PUNCTUATION, options));
        }
        ret += color(')', PUNCTUATION, options);
        break;
      case XML_CTYPE_SEQ:
        ret += color('(', PUNCTUATION, options);
        if (model.children?.length) {
          ret += model.children.map(c => this.#modelString(c, options)).join(color(',', PUNCTUATION, options));
        }
        ret += color(')', PUNCTUATION, options);
        break;
      default:
        throw new Error(`Invalid model type: "${model.type}"`);
    }

    switch (model.quant) {
      case XML_CQUANT_NONE:
        break;
      case XML_CQUANT_OPT:
        ret += color('?', PUNCTUATION, options);
        break;
      case XML_CQUANT_REP:
        ret += color('*', PUNCTUATION, options);
        break;
      case XML_CQUANT_PLUS:
        ret += color('+', PUNCTUATION, options);
        break;
      default:
        throw new Error(`Invalid model quantifier: "${model.quant}"`);
    }
    return ret;
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string.
   * @returns {string} The node, converted to a string.
   */
  toString(options = TOSTRING_OPTS) {
    let ret = color('<!', PUNCTUATION, options);
    ret += color('ELEMENT ', NAME, options);
    ret += color(this.name, ATTRIBUTE, options);
    if (this.model) {
      ret += ' ';
      ret += this.#modelString(this.model, options);
    }
    ret += color('>', PUNCTUATION, options);
    return ret;
  }
}

/**
 * Attribute list declaration.
 *
 * @see https://www.w3.org/TR/xml/#attdecls
 */
export class AttlistDecl extends ParentNode {
  /**
   * Create an attribute list declaration.
   *
   * @param {string} elname Element name.
   * @param {Document|null} [doc] The document this node belongs to.
   */
  constructor(elname, doc = null) {
    super(doc);
    this.elname = elname;
  }

  /**
   * Because the events for AttributeDecl come in strangely, it's hard to
   * tell when the AttlistDecl is done.  Any non-AttributeDecl added is
   * really meant for the enclusing DTD.  This includes Comments and default
   * (usually whitespace) Text items.
   *
   * @param {Node} node The node to add.
   * @returns {Node} The added node.
   */
  add(node) {
    if (node instanceof AttributeDecl || !this.parent) {
      return super.add(node);
    }
    return /** @type {ParentNode} */ (this.parent).add(node);
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string.
   * @returns {string} The node, converted to a string.
   */
  toString(options = TOSTRING_OPTS) {
    let ret = color('<!', PUNCTUATION, options);
    ret += color('ATTLIST ', NAME, options);
    ret += color(this.elname, TEXT, options);

    if (this.children.length === 1) {
      ret += ' ';
      ret += super.toString(options);
    } else {
      const sep = '\n    ';
      ret += sep;
      ret += super.toString({...options, separator: sep});
    }
    ret += color('>', PUNCTUATION, options);
    return ret;
  }
}

/**
 * Attribute definition.
 *
 * @see https://www.w3.org/TR/xml/#NT-AttDef
 */
export class AttributeDecl extends Node {
  /**
   * Creates an instance of AttributeDecl.
   * @param {string} attname Attribute name.
   * @param {string} attType Attribute type.
   * @param {string} dflt Default.
   * @param {boolean} isrequired Required?
   * @param {Document|null} [doc] The document this node belongs to.
   */
  constructor(attname, attType, dflt, isrequired, doc = null) {
    super(doc);
    this.attname = attname;
    this.attType = attType;
    this.dflt = dflt;
    this.isrequired = isrequired;
  }

  /**
   * Convert to string.
   *
   * @param {MaybeStylizedSeparated} [options] How to convert to string.
   * @returns {string} The node, converted to a string.
   */
  toString(options = TOSTRING_OPTS) {
    let ret = color(this.attname, ATTRIBUTE, options);
    ret += ' ';
    // This is not really ideal, but NOTATION-type attlists aren't handled
    // terribly gracefully by expat, which remvoes whitespace.
    const m = this.attType.match(/^NOTATION(?<notation>.*)/);
    if (m?.groups) {
      ret += color('NOTATION ', NAME, options);
      ret += color(m.groups.notation, TEXT, options);
    } else {
      ret += color(this.attType, TEXT, options);
    }
    if (this.dflt) {
      if (this.isrequired) {
        ret += color(' #FIXED', NAME, options);
      }
      ret += color(' "', PUNCTUATION, options);
      ret += color(this.dflt, TEXT, options);
      ret += color('"', PUNCTUATION, options);
    } else if (this.isrequired) {
      ret += color(' #REQUIRED', NAME, options);
    } else {
      ret += color(' #IMPLIED', NAME, options);
    }
    return ret;
  }
}
