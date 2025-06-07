/**
 * Encodings that expat supports.
 *
 * @typedef { undefined|null|"US-ASCII"|"UTF-8"|"UTF-16"|"ISO-8859-1"
 * } XML_Encoding
 */
/**
 * @typedef {object} EntityInfo
 * @property {string} base Base URL.
 * @property {string|Buffer|Uint8Array|Uint8ClampedArray} data Resolved Data.
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
 * @property {XML_Encoding} [encoding] If null will do content sniffing.
 * @property {string|XmlParser.NO_NAMESPACES} [separator='|'] The separator
 *   for namespace URI and element/attribute name.  Use
 *   XmlParser.NO_NAMESPACES to get Expat's old, broken namespace
 *   non-implementation via XmlParserCreate instead of XmlParserCreateNS.
 * @property {boolean} [expandInternalEntities] Expand internal entities.
 * @property {ReadEntity|null} [systemEntity] Expand external entities using
 *   this callback.
 * @property {string|null} [base] Base URI for inclusions.
 * @property {boolean} xmlBase Add xml:base attributes when parsing external
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
     * @param {ParserOptions} opts Options.
     * @returns {dom.Document} The created document.
     */
    static parseFull(txt: string | Buffer | Uint8Array | Uint8ClampedArray, opts: ParserOptions): dom.Document;
    /**
     * Process a tagged template literal containing XML. Streams data into the
     * parser per-chunk.
     *
     * @param {string[]} template Template pieces.
     * @param {...string} sub Substitutions.
     * @returns {Document|undefined} Parsed document, or undefined if not
     *   complete.
     * @throws {Error} XML parse error.
     */
    static fromString(template: string[], ...sub: string[]): Document | undefined;
    /**
     * Create a DOM Parser.
     *
     * @param {ParserOptions} [options]
     *   Encoding to expect from Buffers/etc that are passed to parse().
     */
    constructor(options?: ParserOptions);
    /**
     * Pop the stack.
     * @private
     */
    private _clearAttlist;
    /**
     * Parse a chunk of an XML document.  You can call this multiple times with
     * final=0, then with final=1 when you're done.
     *
     * @param {string|Buffer|Uint8Array|Uint8ClampedArray} str String to parse.
     * @param {number} [final=1] If the last chunk of a document, 1.  Otherwise
     *   use 0.
     * @returns {dom.Document|undefined} The parsed document, if successful and
     *   this was the final chunk.  Otherwise undefined.
     * @throws {Error} On XML parse error.
     */
    parse(str: string | Buffer | Uint8Array | Uint8ClampedArray, final?: number): dom.Document | undefined;
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
    /**
     * Base URL.
     */
    base: string;
    /**
     * Resolved Data.
     */
    data: string | Buffer | Uint8Array | Uint8ClampedArray;
};
export type ReadEntity = (base: string, systemId: string, publicId?: string | undefined) => EntityInfo;
export type ParserOptions = {
    /**
     * If null will do content sniffing.
     */
    encoding?: XML_Encoding;
    /**
     * The separator
     * for namespace URI and element/attribute name.  Use
     * XmlParser.NO_NAMESPACES to get Expat's old, broken namespace
     * non-implementation via XmlParserCreate instead of XmlParserCreateNS.
     */
    separator?: string | symbol | undefined;
    /**
     * Expand internal entities.
     */
    expandInternalEntities?: boolean | undefined;
    /**
     * Expand external entities using
     * this callback.
     */
    systemEntity?: ReadEntity | null | undefined;
    /**
     * Base URI for inclusions.
     */
    base?: string | null | undefined;
    /**
     * Add xml:base attributes when parsing external
     * entitites.
     */
    xmlBase: boolean;
};
import * as dom from './dom.js';
