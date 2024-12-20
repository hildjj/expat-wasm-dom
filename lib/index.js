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
