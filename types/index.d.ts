/**
 * @typedef {import('./domParser.js').XML_Encoding} XML_Encoding
 */
export type XML_Encoding = import('./domParser.js').XML_Encoding;
export type ReadEntity = import('./domParser.js').ReadEntity;
export type EntityInfo = import('./domParser.js').EntityInfo;
export type ParserOptions = import('./domParser.js').ParserOptions;
export type XPathResult = import('./xpath.js').XPathResult;
export type Separated = import('./colors.js').Separated;
export type MaybeStylized = import('./colors.js').MaybeStylized;
export type MaybeStylizedSeparated = import('./colors.js').MaybeStylizedSeparated;
/**
 * @typedef {import('./domParser.js').ReadEntity} ReadEntity
 */
/**
 * @typedef {import('./domParser.js').EntityInfo} EntityInfo
 */
/**
 * @typedef {import('./domParser.js').ParserOptions} ParserOptions
 */
/**
 * @typedef {import('./xpath.js').XPathResult} XPathResult
 */
/**
 * @typedef {import('./colors.js').Separated} Separated
 */
/**
 * @typedef {import('./colors.js').MaybeStylized} MaybeStylized
 */
/**
 * @typedef {import('./colors.js').MaybeStylizedSeparated}
 *  MaybeStylizedSeparated
 */
export * as dom from './dom.js';
export { NS } from './ns.js';
export { XPath } from './xpath.js';
import { DomParser } from './domParser.js';
export default DomParser;
declare const xml: typeof DomParser.fromString;
export { DomParser, xml, };
