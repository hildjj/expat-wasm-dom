import * as dom from './dom.js'
import DomParser from './domParser.js'
import XPath from './xpath.js'

const xml = DomParser.fromString

export default DomParser

export {
  dom,
  DomParser,
  XPath,
  xml,
}
