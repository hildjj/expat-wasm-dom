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
     * @returns {dom.Document} The created document.
     */
    static parseFull(txt: string | Buffer | Uint8Array | Uint8ClampedArray): dom.Document;
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
     * @param {"US-ASCII"|"UTF-8"|"UTF-16"|"ISO-8859-1"|null|undefined} [encoding]
     *   Encoding to expect from Buffers/etc that are passed to parse()
     */
    constructor(encoding?: "US-ASCII" | "UTF-8" | "UTF-16" | "ISO-8859-1" | null | undefined);
    /** @type {XmlParser=} */
    parser: XmlParser | undefined;
    document: dom.Document;
    /** @type {dom.ParentNode} */
    cur: dom.ParentNode;
    /** @type {string?} */
    lastElName: string | null;
    /** @type {string[][]} */
    pendingNS: string[][];
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
}
import { XmlParser } from 'expat-wasm';
import * as dom from './dom.js';
