import { XPath } from './xpath.js';
import type { XPathResult } from './xpath.js';
import type { MaybeStylizedSeparated } from './colors.js';
export type Pieces = {
    /**
     * The namespace URI.
     */
    ns?: string;
    /**
     * The local name.
     */
    local: string;
    /**
     * The prefix used for the current name.
     */
    prefix?: string;
};
export type AttributePair = [Pieces, string];
export type Model = {
    /**
     * Name of the model.
     */
    name?: string;
    /**
     * Empty=1, Any, Mixed, Name, Choice, Seq.
     */
    type?: number;
    /**
     * None=0, Optional, Star, Plus.
     */
    quant?: number;
    /**
     * Children.
     */
    children?: Array<Model>;
};
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
export declare class Node {
    #private;
    /**
     * @type {Node|null}
     */
    parent: Node | null;
    /**
     * Create a node instance.
     * @param {Document|null} [doc] Document this node is in.  May be empty for
     *   fragments.
     */
    constructor(doc?: Document | null);
    get document(): Document | null;
    set document(val: Document | null);
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
     * @returns {XPathResult} The matching nodes.
     * @throws {TypeError} If not a string or pattern.
     */
    get(pattern: string | XPath, context?: Node): XPathResult;
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
     * XML escape a string.
     *
     * @param {string} str The string to escape.
     * @param {boolean} [attrib=false] Is the string an attribute value?
     *   (if so, double-quotes are escaped).
     * @returns {string} The escaped string.
     */
    static escape(str: string, attrib?: boolean): string;
    /**
     * Default implementation of text returns empty string.
     *
     * @abstract
     * @param {string} [_newText] New text to insert. (Ignored in abstract).
     * @returns {string|Node} The concatenated text.
     */
    text(_newText?: string): string | Node;
}
/**
 * Many Node subclasses are potentially parents of other Nodes.  Those
 * classes will derive from this instead of directly from Node, to get
 * the ability to hold children.
 * @abstract
 */
export declare class ParentNode extends Node {
    /**
     * @type {Node[]}
     */
    children: Node[];
    /**
     * Creates an instance of ParentNode.
     * @param {Document|null} [doc] The document this node belongs to.
     */
    constructor(doc?: Document | null);
    get document(): Document | null;
    set document(val: Document | null);
    /**
     * Add a child node.  Side effect: sets the parent of the added node.
     *
     * @param {Node} node The node to add.
     * @returns {Node} The added node.
     */
    add(node: Node): Node;
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
    text(newText?: string): string | Node;
    hasSignificantText(): boolean;
    hasElement(): boolean;
    /**
     * Allow easy iteration over all of the children of this node.
     *
     * @returns {Iterator<Node>} The iterator.
     */
    [Symbol.iterator](): Iterator<Node>;
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
     * @yields {Element} Once for each descendant.
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
     * @yields {Element} Direct child elements.
     */
    elements(local?: string, ns?: string): Generator<Element>;
    /**
     * Convert the node to a string containing representations of all of the
     * children of this node.  Override this and call super as needed.
     *
     * @param {MaybeStylizedSeparated} [options] How to convert to string.
     * @returns {string} The node, converted to a string.
     */
    toString(options?: MaybeStylizedSeparated): string;
}
/**
 * An entire XML document.
 *
 * @extends {ParentNode}
 */
export declare class Document extends ParentNode {
    #private;
    /**
     * Creates an instance of Document.
     */
    constructor();
    get html(): boolean;
    set html(val: boolean);
    /**
     * The root element of the document.
     *
     * @returns {Element|null} The root element if it exists.
     */
    get root(): Element | null;
    /**
     * Get all of the nodes that match the given XPath pattern, with the given
     * context for XPath execution.
     *
     * @param {string|XPath} pattern The pattern to match.
     * @param {Node} [context=this.root] The context node.  Uses the root element
     *   as context if none is provided.
     * @returns {XPathResult} The matching nodes.
     */
    get(pattern: string | XPath, context?: Node): XPathResult;
    /**
     * Get the first matching node for a given pattern, or null if none exist.
     *
     * @param {string|XPath} pattern The pattern to match.
     * @param {Node} [context=this.root] The context node.  Uses the root element
     *   as context if none is provided.
     * @returns {string|number|Node|null} The first match if one exists.
     */
    first(pattern: string | XPath, context?: Node): string | number | Node | null;
    /**
     * Convert to string.
     *
     * @param {MaybeStylizedSeparated} [options] How to convert to string.
     * @returns {string} The node, converted to a string.
     */
    toString(options?: MaybeStylizedSeparated): string;
    /**
     * Create an empty HTML 5 document with doctype and root element.
     *
     * @returns {Document} Empty document.
     */
    static html(): Document;
}
/**
 * XML Element, like <code>&lt;foo/&gt;</code>.
 *
 * @extends {ParentNode}
 */
export declare class Element extends ParentNode {
    #private;
    /** @type {Pieces} */
    name: Pieces;
    /** @type {Attribute[]} */
    att: Attribute[];
    /** @type {Namespace[]} */
    ns: Namespace[];
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
    get document(): Document | null;
    set document(val: Document | null);
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
    /**
     * Get or set the text contained in this element.  If setting, replaces
     * all other existing children.
     *
     * @param {string} [newText] If given, set the text of the element.
     *   Otherwise, gets all descendant text, concatenated together.
     * @returns {string|Node} Text on set, string on get.
     */
    text(newText?: string): string | Node;
    /**
     * Convert to string.
     *
     * @param {MaybeStylizedSeparated} [options] How to convert to string.
     * @returns {string} The node, converted to a string.
     * @throws {Error} On HTML void elements with children.
     */
    toString(options?: MaybeStylizedSeparated): string;
}
/**
 * A prefix/URI combination for a namespace declaration.
 *
 * @class Namespace
 * @extends {Node}
 */
export declare class Namespace extends Node {
    prefix: string;
    uri: string;
    /**
     * Creates an instance of Namespace.
     *
     * @param {string} prefix The prefix.
     * @param {string} uri The URI.
     * @param {Document|null} [doc] The document this node belongs to.
     */
    constructor(prefix: string, uri: string, doc?: Document | null);
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
     * Convert to string.
     *
     * @param {MaybeStylizedSeparated} [options] How to convert to string.
     * @returns {string} The node, converted to a string.
     */
    toString(options?: MaybeStylizedSeparated): string;
}
/**
 * An attribute of an Element.
 *
 * @extends {Node}
 */
export declare class Attribute extends Node {
    /** @type {Pieces} */
    name: Pieces;
    /** @type {string} */
    value: string;
    /**
     * Creates an instance of Attribute.
     *
     * @param {string|Pieces} name If a string, the local name.
     * @param {string} value The value.
     * @param {Document|null} [doc] The document this node belongs to.
     */
    constructor(name: string | Pieces, value: string, doc?: Document | null);
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
     * Get or set the attribute value.
     *
     * @param {string} [newText] If specified, replace.
     * @returns {string|Node} This if newText is provided, otherwise the
     *   existing text.
     */
    text(newText?: string): string | Node;
    /**
     * Convert to string.
     *
     * @param {MaybeStylizedSeparated} [options] How to convert to string.
     * @returns {string} The node, converted to a string.
     */
    toString(options?: MaybeStylizedSeparated): string;
}
/**
 * Plain text in an element.
 *
 * @extends {Node}
 */
export declare class Text extends Node {
    txt: string;
    /**
     * Creates an instance of Text.
     *
     * @param {string} txt The unescaped text.
     * @param {Document|null} [doc] The document this node belongs to.
     */
    constructor(txt: string, doc?: Document | null);
    /**
     * Get or set the text contained in this node.
     *
     * @param {string} [newText] If given, set the text of the node.
     *   Otherwise, gets the contained text.
     * @returns {string|Node} Returns this on set, string on get.
     */
    text(newText?: string): string | Node;
    isEmpty(): boolean;
    /**
     * Convert to string.  If not in a CDataSection, escape text.
     *
     * @param {MaybeStylizedSeparated} [options] How to convert to string.
     * @returns {string} The node, converted to a string.
     */
    toString(options?: MaybeStylizedSeparated): string;
}
/**
 * Like a Text node, but no escaping is done.  Intended for text like "&foo;"
 * when it's really an entity reference and we're not expanding the reference.
 *
 * @extends {Text}
 */
export declare class EntityRef extends Text {
    /**
     * Convert to string.  No escaping is performed.
     *
     * @param {MaybeStylizedSeparated} [options] How to convert to string.
     * @returns {string} The node, converted to a string.
     */
    toString(options?: MaybeStylizedSeparated): string;
}
/**
 * An XML comment that contains text.
 *
 * @extends {Node}
 */
export declare class Comment extends Node {
    txt: string;
    /**
     * Creates an instance of Comment.
     *
     * @param {string} txt The text of the comment.
     * @param {Document|null} [doc] The document this node belongs to.
     */
    constructor(txt: string, doc?: Document | null);
    /**
     * Convert to string.
     *
     * @param {MaybeStylizedSeparated} [options] How to convert to string.
     * @returns {string} The node, converted to a string.
     */
    toString(options?: MaybeStylizedSeparated): string;
}
/**
 * A CDATA section, like <code>&lt;![CDATA[&lt;foo/&gt;]]&gt;</code>.
 *
 * @extends {ParentNode}
 */
export declare class CdataSection extends ParentNode {
    /**
     * Create a CDATA.
     *
     * @param {Document|null} [doc] The document this node belongs to.
     */
    constructor(doc?: Document | null);
    /**
     * Convert to string.
     *
     * @param {MaybeStylizedSeparated} [options] How to convert to string.
     * @returns {string} The node, converted to a string.
     */
    toString(options?: MaybeStylizedSeparated): string;
}
/**
 * XML Declaration, like <code>&lt;?xml version="1.0"?&gt;</code>.
 *
 * @see https://www.w3.org/TR/xml/#NT-XMLDecl
 */
export declare class XmlDeclaration extends Node {
    version: string;
    encoding: string | undefined;
    standalone: boolean;
    /**
     * Creates an instance of XmlDeclaration.
     *
     * @param {string} [version='1.0'] The XML version of the document.
     * @param {string} [encoding] Encoding name.
     * @param {boolean} [standalone] Is standalone?
     * @param {Document|null} [doc] The document this node belongs to.
     */
    constructor(version?: string, encoding?: string, standalone?: boolean, doc?: Document | null);
    /**
     * Convert to string.
     *
     * @param {MaybeStylizedSeparated} [options] How to convert to string.
     * @returns {string} The node, converted to a string.
     */
    toString(options?: MaybeStylizedSeparated): string;
}
/**
 * Processing Instruction, like <code>&lt;?xml-stylesheet href="mystyle.css"
 * type="text/css"?&gt;</code>.
 *
 * @see https://www.w3.org/TR/xml/#sec-pi
 */
export declare class ProcessingInstruction extends Node {
    target: string;
    data: string | undefined;
    /**
     * Creates an instance of ProcessingInstruction.
     *
     * @param {string} target The target.
     * @param {string} [data] Any remaining data.
     * @param {Document|null} [doc] The document this node belongs to.
     */
    constructor(target: string, data?: string, doc?: Document | null);
    /**
     * Convert to string.
     *
     * @param {MaybeStylizedSeparated} [options] How to convert to string.
     * @returns {string} The node, converted to a string.
     */
    toString(options?: MaybeStylizedSeparated): string;
}
/**
 * XML DocType, like <code><!DOCTYPE foo []></code>.
 *
 * @see https://www.w3.org/TR/xml/#NT-doctypedecl
 */
export declare class DoctypeDecl extends ParentNode {
    doctypeName: string;
    sysid: string | undefined;
    pubid: string | undefined;
    hasInternalSubset: boolean | undefined;
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
    /**
     * Convert to string.
     *
     * @param {MaybeStylizedSeparated} [options] How to convert to string.
     * @returns {string} The node, converted to a string.
     */
    toString(options?: MaybeStylizedSeparated): string;
}
/**
 * Entity declaration.
 *
 * @see https://www.w3.org/TR/xml/#sec-entity-decl
 */
export declare class EntityDecl extends Node {
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
    /**
     * Convert to string.
     *
     * @param {MaybeStylizedSeparated} [options] How to convert to string.
     * @returns {string} The node, converted to a string.
     */
    toString(options?: MaybeStylizedSeparated): string;
}
/**
 * Notation declaration.
 *
 * @see https://www.w3.org/TR/xml/#Notations
 */
export declare class NotationDecl extends Node {
    /** @type {string} */
    notationName: string;
    /** @type {string|undefined} */
    base: string | undefined;
    /** @type {string|undefined} */
    systemId: string | undefined;
    /** @type {string|undefined} */
    publicId: string | undefined;
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
    /**
     * Convert to string.
     *
     * @param {MaybeStylizedSeparated} [options] How to convert to string.
     * @returns {string} The node, converted to a string.
     */
    toString(options?: MaybeStylizedSeparated): string;
}
export declare const XML_CTYPE_EMPTY: number;
export declare const XML_CTYPE_ANY: number;
export declare const XML_CTYPE_MIXED: number;
export declare const XML_CTYPE_NAME: number;
export declare const XML_CTYPE_CHOICE: number;
export declare const XML_CTYPE_SEQ: number;
export declare const XML_CQUANT_NONE: number;
export declare const XML_CQUANT_OPT: number;
export declare const XML_CQUANT_REP: number;
export declare const XML_CQUANT_PLUS: number;
/**
 * Element Declaration.
 *
 * @see https://www.w3.org/TR/xml/#NT-elementdecl
 */
export declare class ElementDecl extends Node {
    #private;
    name: string;
    model: Model | undefined;
    /**
     * Creates an instance of ElementDecl.
     *
     * @param {string} name Element name.
     * @param {Model} [model] All of the child declarations.
     * @param {Document|null} [doc] The document this node belongs to.
     */
    constructor(name: string, model?: Model, doc?: Document | null);
    /**
     * Convert to string.
     *
     * @param {MaybeStylizedSeparated} [options] How to convert to string.
     * @returns {string} The node, converted to a string.
     */
    toString(options?: MaybeStylizedSeparated): string;
}
/**
 * Attribute list declaration.
 *
 * @see https://www.w3.org/TR/xml/#attdecls
 */
export declare class AttlistDecl extends ParentNode {
    elname: string;
    /**
     * Create an attribute list declaration.
     *
     * @param {string} elname Element name.
     * @param {Document|null} [doc] The document this node belongs to.
     */
    constructor(elname: string, doc?: Document | null);
    /**
     * Because the events for AttributeDecl come in strangely, it's hard to
     * tell when the AttlistDecl is done.  Any non-AttributeDecl added is
     * really meant for the enclusing DTD.  This includes Comments and default
     * (usually whitespace) Text items.
     *
     * @param {Node} node The node to add.
     * @returns {Node} The added node.
     */
    add(node: Node): Node;
    /**
     * Convert to string.
     *
     * @param {MaybeStylizedSeparated} [options] How to convert to string.
     * @returns {string} The node, converted to a string.
     */
    toString(options?: MaybeStylizedSeparated): string;
}
/**
 * Attribute definition.
 *
 * @see https://www.w3.org/TR/xml/#NT-AttDef
 */
export declare class AttributeDecl extends Node {
    attname: string;
    attType: string;
    dflt: string;
    isrequired: boolean;
    /**
     * Creates an instance of AttributeDecl.
     * @param {string} attname Attribute name.
     * @param {string} attType Attribute type.
     * @param {string} dflt Default.
     * @param {boolean} isrequired Required?
     * @param {Document|null} [doc] The document this node belongs to.
     */
    constructor(attname: string, attType: string, dflt: string, isrequired: boolean, doc?: Document | null);
    /**
     * Convert to string.
     *
     * @param {MaybeStylizedSeparated} [options] How to convert to string.
     * @returns {string} The node, converted to a string.
     */
    toString(options?: MaybeStylizedSeparated): string;
}
