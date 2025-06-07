
/**
 * @typedef {import('./domParser.js').XML_Encoding} XML_Encoding
 */

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

export * as dom from './dom.js';
export {NS} from './ns.js';
export {XPath} from './xpath.js';

import {DomParser} from './domParser.js';
export default DomParser;
const xml = DomParser.fromString;
export {
  DomParser,
  xml,
};
