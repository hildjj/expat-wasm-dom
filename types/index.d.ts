export * as dom from "./dom.js";
export { NS } from "./ns.js";
export { XPath } from "./xpath.js";
export default DomParser;
import { DomParser } from './domParser.js';
export const xml: typeof DomParser.fromString;
export { DomParser };
