export * as dom from './dom.js'
import {DomParser} from './domParser.js'
export {XPath} from './xpath.js'

const xml = DomParser.fromString

export default DomParser

export {
  DomParser,
  xml,
}
