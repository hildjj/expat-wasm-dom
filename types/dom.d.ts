/// <reference types="node" resolution-mode="require"/>
/**
 * @typedef {object} Pieces
 * @property {string} [pieces.ns] - the namespace URI
 * @property {string} pieces.local - the local name
 * @property {string} [pieces.prefix] - the prefix used for the current name
 * @private
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
     * @type {Node?}
     */
    parent: Node | null;
    /**
     * Convert to string.  Overridden by all subclasses.
     *
     * @param {util.InspectOptions} [options] How to convert to string
     * @returns {string} The node, converted to a string
     * @abstract
     */
    toString(options?: util.InspectOptions | undefined): string;
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
     * @returns {string|Node|null} The first match if one exists
     */
    first(pattern: string | XPath, context?: Node | undefined): string | Node | null;
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
     * Convert the node to a string containing representations of all of the
     * children of this node.  Override this and call super as needed.
     *
     * @param {MaybeStylizedSeparated} [options] How to convert to string
     * @returns {string} The node, converted to a string
     */
    toString(options?: MaybeStylizedSeparated | undefined): string;
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
     * The root element of the document.
     *
     * @returns {Element|null} The root element if it exists
     * @readonly
     */
    readonly get root(): Element | null;
    /**
     * Convert to string.
     *
     * @param {object} [options] How to convert to string
     * @param {number} [options.depth=Infinity] Number of layers of children to
     *   output, use <code>Infinity</code> or null for all.
     * @param {boolean} [options.colors=false] Use colors for output
     * @returns {string} The node, converted to a string
     */
    toString(options?: {
        depth?: number | undefined;
        colors?: boolean | undefined;
    } | undefined): string;
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
    constructor(name: string | Pieces, attribs?: AttributePair[] | undefined, ns?: string[][] | undefined);
    name: Pieces;
    att: Attribute[];
    ns: Namespace[];
    /**
     * Find an attribute that matches the given local name and namespace.
     *
     * @param {string} local the local name to search for
     * @param {string} [ns] the namespace to search for.  If not given, match
     *   attributes in any namespace.
     * @returns {Attribute|undefined} Attribute, if one that matches is found
     */
    attribute(local: string, ns?: string | undefined): Attribute | undefined;
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
    /**
     * Convert to string.
     *
     * @param {object} [options] How to convert to string
     * @param {number} [options.depth=Infinity] Number of layers of children to
     *   output, use <code>Infinity</code> or null for all.
     * @param {boolean} [options.colors=false] Use colors for output
     * @returns {string} The node, converted to a string
     */
    toString(options?: {
        depth?: number | undefined;
        colors?: boolean | undefined;
    } | undefined): string;
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
    /**
     * Convert to string.
     *
     * @param {object} [options] How to convert to string
     * @param {number} [options.depth=Infinity] Number of layers of children to
     *   output, use <code>Infinity</code> or null for all.
     * @param {boolean} [options.colors=false] Use colors for output
     * @returns {string} The node, converted to a string
     */
    toString(options?: {
        depth?: number | undefined;
        colors?: boolean | undefined;
    } | undefined): string;
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
    name: Pieces;
    value: string;
    /**
     * Convert to string.
     *
     * @param {object} [options] How to convert to string
     * @param {number} [options.depth=Infinity] Number of layers of children to
     *   output, use <code>Infinity</code> or null for all.
     * @param {boolean} [options.colors=false] Use colors for output
     * @returns {string} The node, converted to a string
     */
    toString(options?: {
        depth?: number | undefined;
        colors?: boolean | undefined;
    } | undefined): string;
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
    /**
     * Convert to string.  If not in a CDataSection, escape text.
     *
     * @param {object} [options] How to convert to string
     * @param {number} [options.depth=Infinity] Number of layers of children to
     *   output, use <code>Infinity</code> or null for all.
     * @param {boolean} [options.colors=false] Use colors for output
     * @returns {string} The node, converted to a string
     */
    toString(options?: {
        depth?: number | undefined;
        colors?: boolean | undefined;
    } | undefined): string;
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
    /**
     * Convert to string.
     *
     * @param {object} [options] How to convert to string
     * @param {number} [options.depth=Infinity] Number of layers of children to
     *   output, use <code>Infinity</code> or null for all.
     * @param {boolean} [options.colors=false] Use colors for output
     * @returns {string} The node, converted to a string
     */
    toString(options?: {
        depth?: number | undefined;
        colors?: boolean | undefined;
    } | undefined): string;
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
     * @param {object} [options] How to convert to string
     * @param {number} [options.depth=Infinity] Number of layers of children to
     *   output, use <code>Infinity</code> or null for all.
     * @param {boolean} [options.colors=false] Use colors for output
     * @returns {string} The node, converted to a string
     */
    toString(options?: {
        depth?: number | undefined;
        colors?: boolean | undefined;
    } | undefined): string;
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
    /**
     * Convert to string.
     *
     * @param {object} [options] How to convert to string
     * @param {number} [options.depth=Infinity] Number of layers of children to
     *   output, use <code>Infinity</code> or null for all.
     * @param {boolean} [options.colors=false] Use colors for output
     * @returns {string} The node, converted to a string
     */
    toString(options?: {
        depth?: number | undefined;
        colors?: boolean | undefined;
    } | undefined): string;
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
    /**
     * Convert to string.
     *
     * @param {object} [options] How to convert to string
     * @param {number} [options.depth=Infinity] Number of layers of children to
     *   output, use <code>Infinity</code> or null for all.
     * @param {boolean} [options.colors=false] Use colors for output
     * @returns {string} The node, converted to a string
     */
    toString(options?: {
        depth?: number | undefined;
        colors?: boolean | undefined;
    } | undefined): string;
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
    /**
     * Convert to string.
     *
     * @param {object} [options] How to convert to string
     * @param {number} [options.depth=Infinity] Number of layers of children to
     *   output, use <code>Infinity</code> or null for all.
     * @param {boolean} [options.colors=false] Use colors for output
     * @returns {string} The node, converted to a string
     */
    toString(options?: {
        depth?: number | undefined;
        colors?: boolean | undefined;
    } | undefined): string;
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
    constructor(entityName: string, isParameterEntity: boolean, value: string, base: string, systemId: string, publicId: string, notationName: string);
    entityName: string;
    isParameterEntity: boolean;
    value: string;
    base: string;
    systemId: string;
    publicId: string;
    notationName: string;
    /**
     * Convert to string.
     *
     * @param {object} [options] How to convert to string
     * @param {number} [options.depth=Infinity] Number of layers of children to
     *   output, use <code>Infinity</code> or null for all.
     * @param {boolean} [options.colors=false] Use colors for output
     * @returns {string} The node, converted to a string
     */
    toString(options?: {
        depth?: number | undefined;
        colors?: boolean | undefined;
    } | undefined): string;
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
    notationName: string;
    base: string | undefined;
    systemId: string | undefined;
    publicId: string | undefined;
    /**
     * Convert to string.
     *
     * @param {object} [options] How to convert to string
     * @param {number} [options.depth=Infinity] Number of layers of children to
     *   output, use <code>Infinity</code> or null for all.
     * @param {boolean} [options.colors=false] Use colors for output
     * @returns {string} The node, converted to a string
     */
    toString(options?: {
        depth?: number | undefined;
        colors?: boolean | undefined;
    } | undefined): string;
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
    /**
     * Convert to string.
     *
     * @param {object} [options] How to convert to string
     * @param {number} [options.depth=Infinity] Number of layers of children to
     *   output, use <code>Infinity</code> or null for all.
     * @param {boolean} [options.colors=false] Use colors for output
     * @returns {string} The node, converted to a string
     */
    toString(options?: {
        depth?: number | undefined;
        colors?: boolean | undefined;
    } | undefined): string;
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
    /**
     * Convert to string.
     *
     * @param {object} [options] How to convert to string
     * @param {number} [options.depth=Infinity] Number of layers of children to
     *   output, use <code>Infinity</code> or null for all.
     * @param {boolean} [options.colors=false] Use colors for output
     * @returns {string} The node, converted to a string
     */
    toString(options?: {
        depth?: number | undefined;
        colors?: boolean | undefined;
    } | undefined): string;
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
    /**
     * Convert to string.
     *
     * @param {object} [options] How to convert to string
     * @param {number} [options.depth=Infinity] Number of layers of children to
     *   output, use <code>Infinity</code> or null for all.
     * @param {boolean} [options.colors=false] Use colors for output
     * @returns {string} The node, converted to a string
     */
    toString(options?: {
        depth?: number | undefined;
        colors?: boolean | undefined;
    } | undefined): string;
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
import util from 'util';
import { XPath } from './xpath.js';
