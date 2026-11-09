/* eslint-disable @typescript-eslint/max-params */
/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  ATTRIBUTE, CLASS, DEFAULT_COLLATOR,
  type MaybeStylized, type MaybeStylizedSeparated,
  NAME, PUNCTUATION, TEXT, TOSTRING_OPTS, color, xmlEscape,
} from './colors.js';
import {XPath, type XPathResult, type XPathResultItem} from './xpath.js';
import type {InspectContext} from 'node:util';
import {LineWrap} from '@cto.af/linewrap';
import type {Model} from 'expat-wasm';

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

interface Pieces {
  /** The namespace URI. */
  ns?: string;

  /** The local name. */
  local: string;

  /** The prefix used for the current name. */
  prefix?: string;
}

export type AttributePair = [Pieces, string];
export interface AttributeObject {
  [key: string]: string;
}

/**
 * The base class for all node types.
 */
export abstract class Node {
  public parent: Node | null = null;
  #document: Document | null = null;

  /**
   * Create a node instance.
   * @param doc Document this node is in.  May be empty for fragments.
   */
  public constructor(doc?: Document | null) {
    this.#document = doc ?? null;
  }

  public get document(): Document | null {
    return this.#document;
  }

  public set document(val: Document | null) {
    this.#document = val;
  }

  public get html(): boolean {
    return Boolean(this.#document?.html);
  }

  public static isNode(n: unknown): n is Node {
    return n instanceof Node;
  }

  /**
   * XML escape a string.
   *
   * @param str The string to escape.
   * @param attrib Is the string an attribute value?
   *   (if so, double-quotes are escaped).
   * @returns The escaped string.
   */
  public static escape(str: string, attrib = false): string {
    return xmlEscape(str, attrib);
  }

  /**
   * Convert to string.  Overridden by all subclasses, but called with super.
   *
   * @abstract
   * @param options How to convert to string?
   * @returns The node, converted to a string.
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  public toString(options = TOSTRING_OPTS): string {
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
   * @param depth Depth of children to inspect.
   * @param options Other inspection options.
   * @returns The formatted string.
   */
  public [Symbol.for('nodejs.util.inspect.custom')](depth?: number, options?: InspectContext): string {
    const opts: MaybeStylized = {...options, depth};
    return `{${color(this.constructor.name, CLASS, opts)} ${this.toString(opts)}}`;
  }

  /**
   * Get all of the nodes that match the given XPath pattern, with the given
   * context for XPath execution.
   *
   * @param pattern The pattern to match.
   * @param context The context node.  Uses this node as context
   *   if none is provided.
   * @returns The matching nodes.
   * @throws Pattern must be string or XPath.
   */
  public get(pattern: string | XPath, context: Node = this): XPathResult {
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
   * @param pattern The pattern to match.
   * @param context The context node.  Uses this node as context
   *   if none is provided.
   * @returns The first match if one exists.
   */
  public first(
    pattern: string | XPath,
    context: Node = this
  ): XPathResultItem | null {
    const res = this.get(pattern, context);
    if (res.length === 0) {
      return null;
    }
    return res[0];
  }

  /**
   * Default implementation of text returns empty string.
   *
   * @abstract
   * @param _newText New text to insert. (Ignored in abstract).
   * @returns The concatenated text.
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Abstract
  public text(_newText?: string): string | Node {
    return '';
  }
}

/**
 * Many Node subclasses are potentially parents of other Nodes.  Those
 * classes will derive from this instead of directly from Node, to get
 * the ability to hold children.
 */
export abstract class ParentNode extends Node {
  public children: Node[];

  /**
   * Creates an instance of ParentNode.
   * @param doc The document this node belongs to.
   */
  public constructor(doc?: Document | null) {
    super(doc);
    this.children = [];
  }

  public override get document(): Document | null {
    return super.document;
  }

  public override set document(val: Document | null) {
    super.document = val;
    this.children.forEach(c => (c.document = val));
  }

  /**
   * Add a child node.  Side effect: sets the parent of the added node.
   *
   * @param node The node to add.
   * @returns The added node.
   */
  public add(node: Node): Node {
    if (Text.isText(node) && (this.children.length > 0)) {
      const prev = this.children[this.children.length - 1];
      if (Text.isText(prev)) {
        prev.txt += node.txt;
        return prev;
      }
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
   * @param newText New text to insert.  Invalid on ParentNode
   *   but used for subclasses.
   * @returns The concatenated text.
   * @throws Can't set text in the abstract implementation.
   */
  public override text(newText?: string): string | Node {
    if (newText != null) {
      throw new Error('Invalid set text operation');
    }
    return this.children.reduce((p, v) => p + v.text(), '');
  }

  public hasSignificantText(): boolean {
    for (const c of this.children) {
      if ((c instanceof Text) && !c.isEmpty()) {
        return true;
      }
    }
    return false;
  }

  public hasElement(): boolean {
    return this.children.some(c => c instanceof Element);
  }

  /**
   * Allow easy iteration over all of the children of this node.
   * @returns Iterator overall children.
   */
  public [Symbol.iterator](): Iterator<Node> {
    return this.children[Symbol.iterator]();
  }

  /**
   * Iterate over all of the descendants of this node, to infinite depth, in
   * prefix order.  That is, parents are yielded before their children.
   *
   * @returns All descendants.
   * @yields Descendent nodes.
   */
  public *descendants(): Generator<Node> {
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
   * @returns All element descendants.
   * @yields Descendent elements.
   */
  public *descendantElements(): Generator<Element> {
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
   * @param local The localname.  If not given, match elements with
   *   any name.
   * @param ns The namespace URI to match.  If not given, match
   *   elements with any namespace.
   * @returns Direct element children.
   * @yields Element children.
   */
  public *elements(local?: string, ns?: string): Generator<Element> {
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
   * @param options How to convert to string.
   * @returns The node, converted to a string.
   */
  public override toString(options = TOSTRING_OPTS): string {
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
 */
export class Document extends ParentNode {
  #html = false;

  /**
   * Creates an instance of Document.
   */
  public constructor() {
    super();
    this.document = this;
  }

  public override get html(): boolean {
    return this.#html;
  }

  public override set html(val: boolean) {
    this.#html = val;
  }

  /**
   * The root element of the document.
   *
   * @returns The root element if it exists.
   */
  public get root(): Element | undefined {
    return this.children.find(c => c instanceof Element);
  }

  /**
   * Create an empty HTML 5 document with doctype and root element.
   *
   * @returns Empty document.
   */
  public static html(): Document {
    const doc = new Document();
    doc.html = true;
    doc.add(new DoctypeDecl('html'));
    doc.add(new Element('html'));
    return doc;
  }

  /**
   * Get all of the nodes that match the given XPath pattern, with the given
   * context for XPath execution.
   *
   * @param pattern The pattern to match.
   * @param context The context node.  Uses the root element as context if
   *   none is provided.
   * @returns The matching nodes.
   */
  public override get(pattern: string | XPath, context?: Node): XPathResult {
    return super.get(pattern, context || this.root || undefined);
  }

  /**
   * Get the first matching node for a given pattern, or null if none exist.
   *
   * @param pattern The pattern to match.
   * @param context The context node.  Uses the root element as context if
   *   none is provided.
   * @returns The first match if one exists.
   */
  public override first(
    pattern: string | XPath,
    context: Node
  ): XPathResultItem | null {
    return super.first(pattern, context || this.root || undefined);
  }

  /**
   * Convert to string.
   *
   * @param options How to convert to string.
   * @returns The node, converted to a string.
   */
  public override toString(options = TOSTRING_OPTS): string {
    Node.prototype.toString.call(this, options);
    return super.toString({...options, separator: ''});
  }
}

/**
 * XML Element, like <code>&lt;foo/&gt;</code>.
 *
 * @extends {ParentNode}
 */
export class Element extends ParentNode {
  public name: Pieces;
  public att: Attribute[];
  public ns: Namespace[];

  /**
   * Creates an instance of Element.
   *
   * @param name If a string, the local name.
   * @param attribs List of name/value pairs for attributes, or options
   *   object.
   * @param ns List of prefix/URI pairs for namespaces that are declared in
   *   this element.
   * @param doc The document this node belongs to.
   */
  public constructor(
    name: string | Pieces,
    attribs: AttributePair[] | AttributeObject = [],
    ns: string[][] = [],
    doc: Document | null = null
  ) {
    super(doc);

    this.name = (typeof name === 'string') ? {local: name} : name;

    this.att = Array.isArray(attribs) ?
      attribs.map(([n, v]) => new Attribute(n, v, this.document)) :
      this.att = Object.entries(attribs)
        .map(([k, v]) => new Attribute({local: k}, v, this.document));

    this.ns = ns.map(
      ([prefix, uri]) => new Namespace(prefix, uri, this.document)
    );
  }

  public override get document(): Document | null {
    return super.document;
  }

  public override set document(val: Document | null) {
    super.document = val;
    this.att.forEach(a => (a.document = val));
    this.ns.forEach(a => (a.document = val));
  }

  /**
   * Find the value of an attribute that matches the given local name and
   * namespace.
   *
   * @param local The local name to search for.
   * @param ns The namespace to search for.  If not given, match
   *   attributes in any namespace.
   * @returns Attribute, if one that matches is found.
   */
  public attr(local: string, ns: string): string | undefined {
    return this.#attribute(local, ns)?.value;
  }

  /**
   * Set an attribute value for an attribute that might or might not exist yet.
   *
   * @param name The attribute name to set.  If a string, use
   *   it as a local name in the global namespace.
   * @param value The value to set.
   * @returns The new/modified Attribute.
   */
  public setAttribute(name: string | Pieces, value: string): Attribute {
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
   * @param name The name of the attribute to return.
   * @returns The removed attribute, if one was found.
   */
  public removeAttribute(name: string | Pieces): Attribute | null {
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
   * @param local The local name to search for.
   * @param ns The namespace URI.  If none given, match elements
   *   in any namespace.
   * @returns The first matching element, if one is found.
   */
  public element(local: string, ns?: string): Element | undefined {
    return this.children.find(e => (e instanceof Element) &&
        (!ns || (ns === e.name.ns)) &&
        (local === e.name.local)) as Element | undefined;
  }

  /**
   * Get or set the text contained in this element.  If setting, replaces
   * all other existing children.
   *
   * @param newText If given, set the text of the element.
   *   Otherwise, gets all descendant text, concatenated together.
   * @returns Text on set, string on get.
   */
  public override text(newText?: string): string | Node {
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
   * @param options How to convert to string.
   * @returns The node, converted to a string.
   * @throws Void element with children.
   */
  public override toString(options = TOSTRING_OPTS): string {
    Node.prototype.toString.call(this, options);

    let ret = color('<', PUNCTUATION, options);
    if (this.name.prefix) {
      ret += color(this.name.prefix, NAME, options);
      ret += color(':', PUNCTUATION, options);
    }

    if (options.pretty) {
      const col = options.collator ?? DEFAULT_COLLATOR;
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

  /**
   * Find an attribute that matches the given local name and namespace.
   *
   * @param local The local name to search for.
   * @param ns The namespace to search for.  If not given, match
   *   attributes in any namespace.
   * @returns Attribute, if one that matches is found.
   */
  #attribute(local: string, ns?: string): Attribute | undefined {
    return this.att.find(a => (
      (!ns || (ns === a.name.ns)) && (local === a.name.local)
    ));
  }
}

/**
 * A prefix/URI combination for a namespace declaration.
 *
 * @class Namespace
 * @extends {Node}
 */
export class Namespace extends Node {
  public prefix: string;
  public uri: string;

  /**
   * Creates an instance of Namespace.
   *
   * @param prefix The prefix.
   * @param uri The URI.
   * @param doc The document this node belongs to.
   */
  public constructor(prefix: string, uri: string, doc: Document | null = null) {
    super(doc);
    this.prefix = prefix;
    this.uri = uri;
  }

  /**
   * Compare two namespaces for ordering, by prefix.
   *
   * @param a First namespace.
   * @param b Second namespace.
   * @param collator How to compare?
   * @returns -1 if a < b, 1 if a > b, 0 if equan.
   */
  public static compare(
    a: Namespace,
    b: Namespace,
    collator: Intl.Collator
  ): number {
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
   * @param options How to convert to string.
   * @returns The node, converted to a string.
   */
  public override toString(options = TOSTRING_OPTS): string {
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
 */
export class Attribute extends Node {
  public name: Pieces;
  public value: string;

  /**
   * Creates an instance of Attribute.
   *
   * @param name If a string, the local name.
   * @param value The value.
   * @param doc The document this node belongs to.
   */
  public constructor(
    name: string | Pieces,
    value: string,
    doc: Document | null = null
  ) {
    super(doc);

    this.name = (typeof name === 'string') ? {local: name} : name;
    this.value = value;
  }

  /**
   * Compare two attributes for ordering.
   *
   * @param a First attribute.
   * @param b Second attribute.
   * @param collator How to compare?
   * @returns -1 if a < b.
   */
  public static compare(
    a: Attribute,
    b: Attribute,
    collator: Intl.Collator
  ): number {
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
   * @param newText If specified, replace.
   * @returns This if newText is provided, otherwise the existing text.
   */
  public override text(newText?: string): string | Node {
    if (newText != null) {
      this.value = newText;
      return this;
    }
    return this.value;
  }

  /**
   * Convert to string.
   *
   * @param options How to convert to string.
   * @returns The node, converted to a string.
   */
  public override toString(options = TOSTRING_OPTS): string {
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
 */
export class Text extends Node {
  public txt: string;

  /**
   * Creates an instance of Text.
   *
   * @param txt The unescaped text.
   * @param doc The document this node belongs to.
   */
  public constructor(txt: string, doc: Document | null = null) {
    super(doc);
    this.txt = txt;
  }

  public static isText(n: Node): n is Text {
    return n instanceof Text;
  }

  /**
   * Get or set the text contained in this node.
   *
   * @param newText If given, set the text of the node.
   *   Otherwise, gets the contained text.
   * @returns Returns this on set, string on get.
   */
  public override text(newText?: string): string | Node {
    if (newText == null) {
      return this.txt;
    }
    this.txt = newText;
    return this;
  }

  /**
   * Empty or whitespace-only.
   * @returns True if empty-ish.
   */
  public isEmpty(): boolean {
    return /^\s*$/.test(this.txt);
  }

  /**
   * Convert to string.  If not in a CDataSection, escape text.
   *
   * @param options How to convert to string.
   * @returns The node, converted to a string.
   */
  public override toString(options = TOSTRING_OPTS): string {
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
 */
export class EntityRef extends Text {
  /**
   * Convert to string.  No escaping is performed.
   *
   * @param options How to convert to string.
   * @returns The node, converted to a string.
   */
  public override toString(options = TOSTRING_OPTS): string {
    return color(this.txt, TEXT, options);
  }
}

/**
 * An XML comment that contains text.
 */
export class Comment extends Node {
  public txt: string;

  /**
   * Creates an instance of Comment.
   *
   * @param txt The text of the comment.
   * @param doc The document this node belongs to.
   */
  public constructor(txt: string, doc: Document | null = null) {
    super(doc);
    this.txt = txt;
  }

  /**
   * Convert to string.
   *
   * @param options How to convert to string.
   * @returns The node, converted to a string.
   */
  public override toString(options = TOSTRING_OPTS): string {
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
 */
export class CdataSection extends ParentNode {
  /**
   * Create a CDATA.
   *
   * @param doc The document this node belongs to.
   */
  public constructor(doc: Document | null = null) {
    super(doc);
  }

  /**
   * Convert to string.
   *
   * @param options How to convert to string.
   * @returns The node, converted to a string.
   */
  public override toString(options = TOSTRING_OPTS): string {
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
  public version: string;
  public encoding: string;
  public standalone: boolean;

  /**
   * Creates an instance of XmlDeclaration.
   *
   * @param version The XML version of the document.
   * @param encoding Encoding name.
   * @param standalone Is standalone?
   * @param doc The document this node belongs to.
   */
  public constructor(
    version = '1.0',
    encoding = '',
    standalone = false,
    doc: Document | null = null
  ) {
    super(doc);
    this.version = version;
    this.encoding = encoding;
    this.standalone = standalone;
  }

  /**
   * Convert to string.
   *
   * @param options How to convert to string.
   * @returns The node, converted to a string.
   */
  public override toString(options = TOSTRING_OPTS): string {
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
  public target: string;
  public data: string | undefined;

  /**
   * Creates an instance of ProcessingInstruction.
   *
   * @param target The target.
   * @param data Any remaining data.
   * @param doc The document this node belongs to.
   */
  public constructor(
    target: string,
    data?: string,
    doc: Document | null = null
  ) {
    super(doc);
    this.target = target;
    this.data = data;
  }

  /**
   * Convert to string.
   *
   * @param options How to convert to string.
   * @returns The node, converted to a string.
   */
  public override toString(options = TOSTRING_OPTS): string {
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

// #region DTD

/**
 * XML DocType, like <code><!DOCTYPE foo []></code>.
 *
 * @see https://www.w3.org/TR/xml/#NT-doctypedecl
 */
export class DoctypeDecl extends ParentNode {
  public doctypeName: string;
  public sysid: string | undefined;
  public pubid: string | undefined;
  public hasInternalSubset: boolean | undefined;

  /**
   * Creates an instance of DoctypeDecl.
   *
   * @param doctypeName Name.
   * @param sysid System ID.
   * @param pubid Public ID.
   * @param hasInternalSubset Internal subset?
   * @param doc The document this node belongs to.
   */
  public constructor(
    doctypeName: string,
    sysid?: string,
    pubid?: string,
    hasInternalSubset?: boolean,
    doc: Document | null = null
  ) {
    super(doc);
    this.doctypeName = doctypeName;
    this.sysid = sysid;
    this.pubid = pubid;
    this.hasInternalSubset = hasInternalSubset;
  }

  /**
   * Convert to string.
   *
   * @param options How to convert to string.
   * @returns The node, converted to a string.
   */
  public override toString(options = TOSTRING_OPTS): string {
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
  public entityName: string;
  public isParameterEntity: boolean;
  public value: string | undefined;
  public base: string | undefined;
  public systemId: string | undefined;
  public publicId: string | undefined;
  public notationName: string | undefined;

  /**
   * Creates an instance of EntityDecl.
   *
   * @param entityName Name.
   * @param isParameterEntity Parameter?
   * @param value Value.
   * @param base Base URL.
   * @param systemId System ID?
   * @param publicId Public ID?
   * @param notationName Notation.
   * @param doc The document this node belongs to.
   */
  public constructor(
    entityName: string,
    isParameterEntity = false,
    value?: string,
    base?: string,
    systemId?: string,
    publicId?: string,
    notationName?: string,
    doc: Document | null = null
  ) {
    super(doc);

    this.entityName = entityName;
    this.isParameterEntity = isParameterEntity;
    this.value = value;
    this.base = base;
    this.systemId = systemId;
    this.publicId = publicId;
    this.notationName = notationName;
  }

  /**
   * Convert to string.
   *
   * @param options How to convert to string.
   * @returns The node, converted to a string.
   */
  public override toString(options = TOSTRING_OPTS): string {
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
  public notationName: string;
  public base: string | undefined;
  public systemId: string | undefined;
  public publicId: string | undefined;

  /**
   * Creates an instance of NotationDecl.
   *
   * @param notationName Notation.
   * @param base Base URI for resolving.
   * @param systemId System ID.
   * @param publicId Public ID.
   * @param doc The document this node belongs to.
   */
  public constructor(
    notationName: string,
    base?: string,
    systemId?: string,
    publicId?: string,
    doc: Document | null = null
  ) {
    super(doc);

    this.notationName = notationName;
    this.base = base;
    this.systemId = systemId;
    this.publicId = publicId;
  }

  /**
   * Convert to string.
   *
   * @param options How to convert to string.
   * @returns The node, converted to a string.
   */
  public override toString(options = TOSTRING_OPTS): string {
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

/**
 * Element Declaration.
 *
 * @see https://www.w3.org/TR/xml/#NT-elementdecl
 */
export class ElementDecl extends Node {
  public name: string;
  public model: Model | undefined;

  /**
   * Creates an instance of ElementDecl.
   *
   * @param name Element name.
   * @param model All of the child declarations.
   * @param doc The document this node belongs to.
   */
  public constructor(name: string, model?: Model, doc: Document | null = null) {
    super(doc);
    this.name = name;
    this.model = model;
  }

  /**
   * Convert to string.
   *
   * @param options How to convert to string.
   * @returns The node, converted to a string.
   */
  public override toString(options = TOSTRING_OPTS): string {
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

  /**
   * Convert the model to a string.
   *
   * @param model Model.
   * @param options Options.
   * @returns Converted model.
   * @throws Invalid model.
   */
  #modelString(model: Model, options: MaybeStylizedSeparated): string {
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
}

/**
 * Attribute list declaration.
 *
 * @see https://www.w3.org/TR/xml/#attdecls
 */
export class AttlistDecl extends ParentNode {
  public elname: string;

  /**
   * Create an attribute list declaration.
   *
   * @param elname Element name.
   * @param doc The document this node belongs to.
   */
  public constructor(elname: string, doc: Document | null = null) {
    super(doc);
    this.elname = elname;
  }

  /**
   * Because the events for AttributeDecl come in strangely, it's hard to
   * tell when the AttlistDecl is done.  Any non-AttributeDecl added is
   * really meant for the enclusing DTD.  This includes Comments and default
   * (usually whitespace) Text items.
   *
   * @param node The node to add.
   * @returns The added node.
   */
  public override add(node: Node): Node {
    if (node instanceof AttributeDecl || !this.parent) {
      return super.add(node);
    }
    return (this.parent as ParentNode).add(node);
  }

  /**
   * Convert to string.
   *
   * @param options How to convert to string.
   * @returns The node, converted to a string.
   */
  public override toString(options = TOSTRING_OPTS): string {
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
  public attname: string;
  public attType: string;
  public dflt: string;
  public isrequired: boolean;

  /**
   * Creates an instance of AttributeDecl.
   * @param attname Attribute name.
   * @param attType Attribute type.
   * @param dflt Default.
   * @param isrequired Required?
   * @param doc The document this node belongs to.
   */
  public constructor(
    attname: string,
    attType: string,
    dflt: string,
    isrequired: boolean,
    doc: Document | null = null
  ) {
    super(doc);
    this.attname = attname;
    this.attType = attType;
    this.dflt = dflt;
    this.isrequired = isrequired;
  }

  /**
   * Convert to string.
   *
   * @param options How to convert to string.
   * @returns The node, converted to a string.
   */
  public override toString(options = TOSTRING_OPTS): string {
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
