/**
 * Encodings that expat supports.
 *
 * @typedef { undefined|null|"US-ASCII"|"UTF-8"|"UTF-16"|"ISO-8859-1"
 * } XML_Encoding
 */
/**
 * @typedef {object} EntityInfo
 * @prop {string} base
 * @prop {string|Buffer|Uint8Array|Uint8ClampedArray} data
 */
/**
 * @callback ReadEntity
 * @param {string} base
 * @param {string} systemId
 * @param {string} [publicId]
 * @returns {EntityInfo}
 */
/**
 * @typedef {object} ParserOptions
 * @prop {XML_Encoding} [encoding] null will do content
 *   sniffing.
 * @prop {string|XmlParser.NO_NAMESPACES} [separator='|'] the separator
 *   for namespace URI and element/attribute name.  Use
 *   XmlParser.NO_NAMESPACES to get Expat's old, broken namespace
 *   non-implementation via XmlParserCreate instead of XmlParserCreateNS.
 * @prop {boolean} [expandInternalEntities] expand internal entities
 * @prop {ReadEntity|null} [systemEntity] expand external entities using this
 *   callback
 * @prop {string|null} [base] Base URI for inclusions
 * @prop {boolean} xmlBase Add xml:base attributes when parsing external
 *   entitites.
 */
/**
 * Parse XML text to a Document Object Model.
 *
 * You should call .destroy() when done, or you will leak memory from
 * the parser WASM instance.
 */
export class DomParser {
    /**
     * Parse a full document.
     *
     * @param {string|Buffer|Uint8Array|Uint8ClampedArray} txt The text to parse.
     * @param {ParserOptions} opts
     * @returns {dom.Document} The created document.
     */
    static parseFull(txt: string | Buffer | Uint8Array | Uint8ClampedArray, opts: ParserOptions): dom.Document;
    /**
     * Process a tagged template literal containing XML.
     * Streams data into the parser per-chunk.
     *
     * @param {string[]} template Template pieces
     * @param {...string} sub Substitutions
     */
    static fromString(template: string[], ...sub: string[]): dom.Document | undefined;
    /**
     * Create a DOM Parser.
     *
     * @param {ParserOptions} [options]
     *   Encoding to expect from Buffers/etc that are passed to parse()
     */
    constructor(options?: ParserOptions | undefined);
    /**
     * Pop the stack.
     * @private
     */
    private _clearAttlist;
    /**
     * Parse a chunk of an XML document.  You can call this multiple times with
     * final=0, then with final=1 when you're done.
     *
     * @param {string|Buffer|Uint8Array|Uint8ClampedArray} str
     * @param {number} [final=1] If the last chunk of a document, 1.  Otherwise
     *   use 0.
     * @returns {dom.Document=} The parsed document, if successful and this was
     *   the final chunk.  Otherwise 0.
     */
    parse(str: string | Buffer | Uint8Array | Uint8ClampedArray, final?: number | undefined): dom.Document | undefined;
    /**
     * Destroy this instance, cleaning up parser resources.
     */
    destroy(): void;
    #private;
}
/**
 * Encodings that expat supports.
 */
export type XML_Encoding = undefined | null | "US-ASCII" | "UTF-8" | "UTF-16" | "ISO-8859-1";
export type EntityInfo = {
    base: string;
    data: string | Buffer | Uint8Array | Uint8ClampedArray;
};
export type ReadEntity = (base: string, systemId: string, publicId?: string | undefined) => EntityInfo;
export type ParserOptions = {
    /**
     * null will do content
     * sniffing.
     */
    encoding?: XML_Encoding;
    /**
     * the separator
     * for namespace URI and element/attribute name.  Use
     * XmlParser.NO_NAMESPACES to get Expat's old, broken namespace
     * non-implementation via XmlParserCreate instead of XmlParserCreateNS.
     */
    separator?: string | symbol | undefined;
    /**
     * expand internal entities
     */
    expandInternalEntities?: boolean | undefined;
    /**
     * expand external entities using this
     * callback
     */
    systemEntity?: ReadEntity | null | undefined;
    /**
     * Base URI for inclusions
     */
    base?: string | null | undefined;
    /**
     * Add xml:base attributes when parsing external
     * entitites.
     */
    xmlBase: boolean;
};
import * as dom from './dom.js';
