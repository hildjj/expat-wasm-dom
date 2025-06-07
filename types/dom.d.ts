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
     * XML escape a string.
     *
     * @param {string} str The string to escape.
     * @param {boolean} [attrib=false] Is the string an attribute value?
     *   (if so, double-quotes are escaped).
     * @returns {string} The escaped string.
     */
    static escape(str: string, attrib?: boolean): string;
    /**
     * Create a node instance.
     * @param {Document|null} [doc] Document this node is in.  May be empty for
     *   fragments.
     */
    constructor(doc?: Document | null);
    /**
     * @type {Node|null}
     */
    parent: Node | null;
    set document(val: Document | null);
    get document(): Document | null;
    get html(): boolean;
    /**
     * Convert to string.  Overridden by all subclasses.
     *
     * @abstract
     * @param {MaybeStylizedSeparated} [options] How to convert to string?
     * @returns {string} The node, converted to a string.
     */
    toString(options?: MaybeStylizedSeparated): string;
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
    get(pattern: string | XPath, context?: Node): import("./xpath.js").XPathResult;
    /**
     * Get the first matching node for a given pattern, or null if none exist.
     *
     * @param {string|XPath} pattern The pattern to match.
     * @param {Node} [context=this] The context node.  Uses this node as context
     *   if none is provided.
     * @returns {string|Node|number|null} The first match if one exists.
     */
    first(pattern: string | XPath, context?: Node): string | Node | number | null;
    /**
     * Default implementation of text returns empty string.
     *
     * @abstract
     * @param {string} [_newText] New text to insert. (Ignored in abstract).
     * @returns {string|Node} The concatenated text.
     */
    text(_newText?: string): string | Node;
    #private;
}
/**
 * Many Node subclasses are potentially parents of other Nodes.  Those
 * classes will derive from this instead of directly from Node, to get
 * the ability to hold children.
 * @abstract
 */
export class ParentNode extends Node {
    /**
     * @type {Node[]}
     */
    children: Node[];
    /**
     * Add a child node.  Side effect: sets the parent of the added node.
     *
     * @param {Node} node The node to add.
     * @returns {Node} The added node.
     */
    add(node: Node): Node;
    hasSignificantText(): boolean;
    hasElement(): boolean;
    /**
     * Iterate over all of the descendants of this node, to infinite depth, in
     * prefix order.  That is, parents are yielded before their children.
     *
     * @returns {Generator<Node>} All descendants.
     * @yields {Node} Descendant nodes.
     */
    descendants(): Generator<Node>;
    /**
     * Iterate over all of the descendants of this node which are Elements,
     * to infinite depth, in prefix order.  That is, parents are yielded before
     * their children.
     *
     * @returns {Generator<Element>} All element descendants.
     * @yields {Element}
     */
    descendantElements(): Generator<Element>;
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
    elements(local?: string, ns?: string): Generator<Element>;
    /**
     * Allow easy iteration over all of the children of this node.
     *
     * @returns {Iterator<Node>} The iterator.
     */
    [Symbol.iterator](): Iterator<Node>;
}
/**
 * An entire XML document.
 *
 * @extends {ParentNode}
 */
export class Document extends ParentNode {
    /**
     * Create an empty HTML 5 document with doctype and root element.
     *
     * @returns {Document} Empty document.
     */
    static html(): Document;
    /**
     * Creates an instance of Document.
     */
    constructor();
    document: this;
    set html(val: boolean);
    get html(): boolean;
    /**
     * The root element of the document.
     *
     * @readonly
     * @returns {Element|null} The root element if it exists.
     */
    readonly get root(): Element | null;
    #private;
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
    constructor(name: string | Pieces, attribs?: AttributePair[] | Record<string, string>, ns?: string[][], doc?: Document | null);
    /** @type {Pieces} */
    name: Pieces;
    /** @type {Attribute[]} */
    att: Attribute[];
    /** @type {Namespace[]} */
    ns: Namespace[];
    /**
     * Find the value of an attribute that matches the given local name and
     * namespace.
     *
     * @param {string} local The local name to search for.
     * @param {string} [ns] The namespace to search for.  If not given, match
     *   attributes in any namespace.
     * @returns {string|undefined} Attribute, if one that matches is found.
     */
    attr(local: string, ns?: string): string | undefined;
    /**
     * Set an attribute value for an attribute that might or might not exist yet.
     *
     * @param {string|Pieces} name The attribute name to set.  If a string, use
     *   it as a local name in the global namespace.
     * @param {string} value The value to set.
     * @returns {Attribute} The new/modified Attribute.
     */
    setAttribute(name: string | Pieces, value: string): Attribute;
    /**
     * Remove an attribute.
     *
     * @param {string|Pieces} name The name of the attribute to return.
     * @returns {Attribute|null} The removed attribute, if one was found.
     */
    removeAttribute(name: string | Pieces): Attribute | null;
    /**
     * Find a direct child element of the given local name and namespace.
     *
     * @param {string} local The local name to search for.
     * @param {string} [ns] The namespace URI.  If none given, match elements
     *   in any namespace.
     * @returns {Element|undefined} The first matching element, if one is found.
     */
    element(local: string, ns?: string): Element | undefined;
    #private;
}
/**
 * A prefix/URI combination for a namespace declaration.
 *
 * @class Namespace
 * @extends {Node}
 */
export class Namespace extends Node {
    /**
     * Compare two namespaces for ordering, by prefix.
     *
     * @param {Namespace} a First namespace.
     * @param {Namespace} b Second namespace.
     * @param {Intl.Collator} collator How to compare?
     * @returns {number} -1 if a < b, 1 if a > b, 0 if equan.
     */
    static compare(a: Namespace, b: Namespace, collator: Intl.Collator): number;
    /**
     * Creates an instance of Namespace.
     *
     * @param {string} prefix The prefix.
     * @param {string} uri The URI.
     * @param {Document|null} [doc] The document this node belongs to.
     */
    constructor(prefix: string, uri: string, doc?: Document | null);
    prefix: string;
    uri: string;
}
/**
 * An attribute of an Element.
 *
 * @extends {Node}
 */
export class Attribute extends Node {
    /**
     * Compare two attributes for ordering.
     *
     * @param {Attribute} a First attribute.
     * @param {Attribute} b Second attribute.
     * @param {Intl.Collator} collator How to compare?
     * @returns {number} -1 if a < b.
     */
    static compare(a: Attribute, b: Attribute, collator: Intl.Collator): number;
    /**
     * Creates an instance of Attribute.
     *
     * @param {string|Pieces} name If a string, the local name.
     * @param {string} value The value.
     * @param {Document|null} [doc] The document this node belongs to.
     */
    constructor(name: string | Pieces, value: string, doc?: Document | null);
    /** @type {Pieces} */
    name: Pieces;
    /** @type {string} */
    value: string;
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
    constructor(txt: string, doc?: Document | null);
    txt: string;
    isEmpty(): boolean;
}
/**
 * Like a Text node, but no escaping is done.  Intended for text like "&foo;"
 * when it's really an entity reference and we're not expanding the reference.
 *
 * @extends {Text}
 */
export class EntityRef extends Text {
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
    constructor(txt: string, doc?: Document | null);
    txt: string;
}
/**
 * A CDATA section, like <code>&lt;![CDATA[&lt;foo/&gt;]]&gt;</code>.
 *
 * @extends {ParentNode}
 */
export class CdataSection extends ParentNode {
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
    constructor(version?: string, encoding?: string, standalone?: boolean, doc?: Document | null);
    version: string;
    encoding: string | undefined;
    standalone: boolean;
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
    constructor(target: string, data?: string, doc?: Document | null);
    target: string;
    data: string | undefined;
}
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
    constructor(doctypeName: string, sysid?: string, pubid?: string, hasInternalSubset?: boolean, doc?: Document | null);
    doctypeName: string;
    sysid: string | undefined;
    pubid: string | undefined;
    hasInternalSubset: boolean | undefined;
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
    constructor(entityName: string, isParameterEntity?: boolean, value?: string, base?: string, systemId?: string, publicId?: string, notationName?: string, doc?: Document | null);
    /** @type {string} */
    entityName: string;
    /** @type {boolean} */
    isParameterEntity: boolean;
    /** @type {string|undefined} */
    value: string | undefined;
    /** @type {string|undefined} */
    base: string | undefined;
    /** @type {string|undefined} */
    systemId: string | undefined;
    /** @type {string|undefined} */
    publicId: string | undefined;
    /** @type {string|undefined} */
    notationName: string | undefined;
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
    constructor(notationName: string, base?: string, systemId?: string, publicId?: string, doc?: Document | null);
    /** @type {string} */
    notationName: string;
    /** @type {string|undefined} */
    base: string | undefined;
    /** @type {string|undefined} */
    systemId: string | undefined;
    /** @type {string|undefined} */
    publicId: string | undefined;
}
export const XML_CTYPE_EMPTY: number;
export const XML_CTYPE_ANY: number;
export const XML_CTYPE_MIXED: number;
export const XML_CTYPE_NAME: number;
export const XML_CTYPE_CHOICE: number;
export const XML_CTYPE_SEQ: number;
export const XML_CQUANT_NONE: number;
export const XML_CQUANT_OPT: number;
export const XML_CQUANT_REP: number;
export const XML_CQUANT_PLUS: number;
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
    constructor(name: string, model?: Model, doc?: Document | null);
    name: string;
    model: Model | undefined;
    #private;
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
    constructor(elname: string, doc?: Document | null);
    elname: string;
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
    constructor(attname: string, attType: string, dflt: string, isrequired: boolean, doc?: Document | null);
    attname: string;
    attType: string;
    dflt: string;
    isrequired: boolean;
}
export type Separated = {
    /**
     * How to sort?
     */
    collator?: Intl.Collator | undefined;
    /**
     * Reduce whitespace if true.
     */
    compressed?: boolean | undefined;
    /**
     * Indent by how many spaces?
     */
    indent?: number | undefined;
    /**
     * Indent by text.  Ignores indent.
     */
    indentText?: string | undefined;
    /**
     * Text for newlines.
     */
    newline?: string | undefined;
    /**
     * Pretty print.  Sets other options.
     */
    pretty?: boolean | undefined;
    /**
     * Character to use for quoting attributes.
     */
    quote?: string | undefined;
    /**
     * Remove comments?
     */
    removeComments?: boolean | undefined;
    /**
     * TBD.
     */
    separator?: string | undefined;
    /**
     * Where to break lines.
     */
    width?: number | undefined;
    /**
     * How to wrap lines.
     */
    wrap?: LineWrap | undefined;
};
export type MaybeStylized = Partial<util.InspectOptionsStylized>;
export type MaybeStylizedSeparated = MaybeStylized & Separated;
export type Pieces = {
    /**
     * The namespace URI.
     */
    ns?: string | undefined;
    /**
     * The local name.
     */
    local: string;
    /**
     * The prefix used for the current name.
     */
    prefix?: string | undefined;
};
export type AttributePair = [Pieces, string];
export type Model = {
    /**
     * Name of the model.
     */
    name?: string | undefined;
    /**
     * Empty=1, Any, Mixed, Name, Choice, Seq.
     */
    type?: number | undefined;
    /**
     * None=0, Optional, Star, Plus.
     */
    quant?: number | undefined;
    /**
     * Children.
     */
    children?: Model[] | undefined;
};
import { XPath } from './xpath.js';
import { LineWrap } from '@cto.af/linewrap';
import util from 'node:util';
