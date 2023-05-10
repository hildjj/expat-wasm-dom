/// <reference types="node" resolution-mode="require"/>
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
     * XML escape a string
     *
     * @static
     * @param {string} str The string to escape
     * @param {boolean} [attrib=false] Is the string an attribute value?
     *   (if so, double-quotes are escaped)
     * @returns {string} The escaped string
     */
    static escape(str: string, attrib?: boolean | undefined): string;
    /**
     * @param {Node} node
     * @param {boolean} html
     * @returns {boolean} true if changed
     */
    static [SET_HTML](node: Node, html: boolean): boolean;
    /**
     * @type {Node?}
     */
    parent: Node | null;
    /**
     * Convert to string.  Overridden by all subclasses.
     *
     * @param {MaybeStylizedSeparated} [options] How to convert to string
     * @returns {string} The node, converted to a string
     * @abstract
     */
    toString(options?: MaybeStylizedSeparated | undefined): string;
    /**
     * Get all of the nodes that match the given XPath pattern, with the given
     * context for XPath execution.
     *
     * @param {string|XPath} pattern The pattern to match
     * @param {Node} [context=this] The context node.  Uses this node as context
     *   if none is provided.
     * @returns {import('./xpath.js').XPathResult} The matching nodes
     */
    get(pattern: string | XPath, context?: Node | undefined): import('./xpath.js').XPathResult;
    /**
     * Get the first matching node for a given pattern, or null if none exist.
     *
     * @param {string|XPath} pattern The pattern to match
     * @param {Node} [context=this] The context node.  Uses this node as context
     *   if none is provided.
     * @returns {string|Node|number|null} The first match if one exists
     */
    first(pattern: string | XPath, context?: Node | undefined): string | Node | number | null;
    /**
     * Find the Document that this node is in, if it is in a Document.
     *
     * @returns {Document|null} The document, if one is found
     * @readonly
     */
    readonly get document(): Document | null;
    /**
     * Default implementation of text returns empty string.
     *
     * @param {string} [newText] New text to insert
     * @returns {string|Node} The concatenated text
     * @abstract
     */
    text(newText?: string | undefined): string | Node;
    /**
     * Custom inspection.
     *
     * @param {number} [depth=2] Depth of children to inspect
     * @param {util.InspectOptionsStylized} [options] Other inspection options
     * @returns {string} The formatted string
     */
    [util.inspect.custom](depth?: number | undefined, options?: util.InspectOptionsStylized | undefined): string;
    /**
     * @type {boolean}
     */
    [HTML]: boolean;
}
/**
 * Many Node subclasses are potentially parents of other Nodes.  Those
 * classes will derive from this instead of directly from Node, to get
 * the ability to hold children.
 * @abstract
 */
export class ParentNode extends Node {
    /**
     * @param {ParentNode} node
     * @param {boolean} html
     * @returns {boolean} true if changed
     */
    static [SET_HTML](node: ParentNode, html: boolean): boolean;
    /**
     * @type {Node[]}
     */
    children: Node[];
    /**
     * Add a child node.  Side effect: sets the parent of the added node.
     *
     * @param {Node} node The node to add
     * @returns {Node} The added node
     */
    add(node: Node): Node;
    /**
     * Iterate over all of the descendants of this node, to infinite depth, in
     * prefix order.  That is, parents are yielded before their children.
     * @returns {Generator<Node>}
     */
    descendants(): Generator<Node>;
    /**
     * Iterate over all of the descendants of this node which are Elements,
     * to infinite depth, in prefix order.  That is, parents are yielded before
     * their children.
     * @returns {Generator<Element>}
     */
    descendantElements(): Generator<Element>;
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
    elements(local?: string | undefined, ns?: string | undefined): Generator<Element>;
    /**
     * Allow easy iteration over all of the children of this node
     *
     * @returns {Iterator<Node>} The iterator
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
     * @returns {Document}
     */
    static html(): Document;
    /**
     * The root element of the document.
     *
     * @returns {Element|null} The root element if it exists
     * @readonly
     */
    readonly get root(): Element | null;
}
/**
 * XML Element, like <code>&lt;foo/&gt;</code>.
 *
 * @extends {ParentNode}
 */
export class Element extends ParentNode {
    /**
     * @param {Element} node
     * @param {boolean} html
     * @returns {boolean} true if changed
     */
    static [SET_HTML](node: Element, html: boolean): boolean;
    /**
     * Creates an instance of Element.
     *
     * @param {string|Pieces} name If a string, the local name.
     * @param {AttributePair[]|Record<string,string>} [attribs=[]] List of
     *   name/value pairs for attributes.
     * @param {string[][]} [ns=[]] List of prefix/URI pairs
     *   for namespaces that are declared in this element.
     */
    constructor(name: string | Pieces, attribs?: Record<string, string> | AttributePair[] | undefined, ns?: string[][] | undefined);
    /** @type {Pieces} */
    name: Pieces;
    /** @type {Attribute[]} */
    att: Attribute[];
    /** @type {Namespace[]} */
    ns: Namespace[];
    /**
     * Find an attribute that matches the given local name and namespace.
     *
     * @param {string} local the local name to search for
     * @param {string} [ns] the namespace to search for.  If not given, match
     *   attributes in any namespace.
     * @returns {Attribute|undefined} Attribute, if one that matches is found
     * @private
     */
    private _attribute;
    /**
     * Find the value of an attribute that matches the given local name and
     * namespace.
     *
     * @param {string} local the local name to search for
     * @param {string} [ns] the namespace to search for.  If not given, match
     *   attributes in any namespace.
     * @returns {string|undefined} Attribute, if one that matches is found
     */
    attr(local: string, ns?: string | undefined): string | undefined;
    /**
     * Set an attribute value for an attribute that might or might not exist yet.
     *
     * @param {string|Pieces} name The attribute name to set.  If a string, use
     *   it as a local name in the global namespace.
     * @param {string} value The value to set.
     * @returns {Attribute} the new/modified Attribute
     */
    setAttribute(name: string | Pieces, value: string): Attribute;
    /**
     * Remove an attribute.
     *
     * @param {string|Pieces} name The name of the attribute to return
     * @returns {Attribute|null} The removed attribute, if one was found
     */
    removeAttribute(name: string | Pieces): Attribute | null;
    /**
     * Find a direct child element of the given local name and namespace.
     *
     * @param {string} local The local name to search for
     * @param {string} [ns] The namespace URI.  If none given, match elements
     *   in any namespace.
     * @returns {Element|undefined} The first matching element, if one is found.
     */
    element(local: string, ns?: string | undefined): Element | undefined;
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
    constructor(prefix: string, uri: string);
    prefix: string;
    uri: string;
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
    constructor(name: string | Pieces, value: string);
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
     * @param {string} txt The unescaped text
     */
    constructor(txt: string);
    txt: string;
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
    constructor(txt: string);
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
    constructor(version?: string | undefined, encoding?: string | undefined, standalone?: boolean | undefined);
    version: string;
    encoding: string | undefined;
    standalone: boolean;
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
    constructor(target: string, data?: string | undefined);
    target: string;
    data: string | undefined;
}
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
    constructor(doctypeName: string, sysid?: string | undefined, pubid?: string | undefined, hasInternalSubset?: boolean | undefined);
    doctypeName: string;
    sysid: string | undefined;
    pubid: string | undefined;
    hasInternalSubset: boolean | undefined;
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
     * @param {boolean} [isParameterEntity=false]
     * @param {string} [value]
     * @param {string} [base]
     * @param {string} [systemId]
     * @param {string} [publicId]
     * @param {string} [notationName]
     */
    constructor(entityName: string, isParameterEntity?: boolean | undefined, value?: string | undefined, base?: string | undefined, systemId?: string | undefined, publicId?: string | undefined, notationName?: string | undefined);
    /** @type {string} */
    entityName: string;
    /** @type {boolean} */
    isParameterEntity: boolean;
    /** @type {string=} */
    value: string | undefined;
    /** @type {string=} */
    base: string | undefined;
    /** @type {string=} */
    systemId: string | undefined;
    /** @type {string=} */
    publicId: string | undefined;
    /** @type {string=} */
    notationName: string | undefined;
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
    constructor(notationName: string, base?: string | undefined, systemId?: string | undefined, publicId?: string | undefined);
    /** @type {string} */
    notationName: string;
    /** @type {string=} */
    base: string | undefined;
    /** @type {string=} */
    systemId: string | undefined;
    /** @type {string=} */
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
    constructor(name: string, model: Model);
    name: string;
    model: Model;
    /**
     *
     * @param {Model} model
     * @param {MaybeStylizedSeparated} options
     * @returns {string}
     * @private
     */
    private _modelString;
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
    constructor(elname: string);
    elname: string;
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
    constructor(attname: string, attType: string, dflt: string, isrequired: boolean);
    attname: string;
    attType: string;
    dflt: string;
    isrequired: boolean;
}
export type Stylize = (text: string, Style: util.Style) => string;
export type MaybeStylized = Partial<util.InspectOptionsStylized>;
export type Separated = {
    separator?: string | undefined;
};
export type MaybeStylizedSeparated = MaybeStylized & Separated;
export type Pieces = {
    /**
     * - the namespace URI
     */
    ns?: string | undefined;
    /**
     * - the local name
     */
    local: string;
    /**
     * - the prefix used for the current name
     */
    prefix?: string | undefined;
};
export type AttributePair = [Pieces, string];
export type Model = {
    /**
     * - Name of the model
     */
    name: string;
    /**
     * - Empty=1, Any, Mixed, Name, Choice, Seq
     */
    type: number;
    /**
     * - None=0, Optional, Star, Plus
     */
    quant: number;
    children: Array<Model>;
};
import { XPath } from './xpath.js';
import util from 'util';
declare const HTML: unique symbol;
declare const SET_HTML: unique symbol;
export {};
