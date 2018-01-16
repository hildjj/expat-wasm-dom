'use strict'

const grammar = require('./xpathPattern')
const dom = require('./dom')

// this is just a light implementations of a tiny subset of xpath
class XPath {
  constructor (pattern) {
    this._parse(pattern)
  }
  _parse (pattern) {
    if (typeof pattern !== 'string') {
      throw new TypeError('pattern required')
    }
    this.ops = []
    this.ops.push(...grammar.parse(pattern))
  }
  execute (context) {
    let cur = [context]
    for (const [op, ...args] of this.ops) {
      cur = cur.reduce((p, v, i) => {
        return p.concat(this[op](i, v, ...args))
      }, [])
    }
    return cur
  }
  _childElem (num, context, name) {
    if (context instanceof dom.Element) {
      return [...context.elements(name)]
    }
    if (context instanceof dom.Document) {
      const root = context.root
      if (root.name.local === name) {
        return [root]
      }
    }
    return []
  }
  _matchNumber (num, context, match) {
    if (num + 1 === match) {
      return [context]
    }
    return []
  }
  _text (num, context) {
    return [context.text()]
  }
  _doc (num, context) {
    const doc = context.document
    // will be null on fragments
    if (doc) {
      return [doc]
    }
    return []
  }
  _attrib (num, context, name) {
    if (context instanceof dom.Element) {
      const a = context.attribute(name)
      if (a) {
        return [a]
      }
    }
    return []
  }
  _filter (num, context, [op, ...args], val) {
    const cur = this[op](0, context, ...args)
    if (cur.length === 0) { return [] }
    // TODO: element matches text, I think
    if (!val || (cur.indexOf(val) !== -1)) {
      return [context]
    }
    return []
  }
}
module.exports = XPath
