'use strict'

const DomParser = require('./domParser')

module.exports = {
  dom: require('./dom'),
  DomParser,
  XPath: require('./xpath'),
  xml: DomParser.fromString
}
