export type {EntityInfo, ParserOptions, ReadEntity, XML_Encoding} from './domParser.js';
export type {Functor, OpFunction, XPathResult, XPathResultItem} from './xpath.js';
export type {MaybeStylized, MaybeStylizedSeparated, Separated} from './colors.js';

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
