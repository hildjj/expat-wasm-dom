'use strict'

const grammar = require('./xpathPattern')
const dom = require('./dom')
const util = require('util')

// this is just a light implementations of a tiny subset of xpath
class XPath {
  constructor (pattern) {
    if (typeof pattern !== 'string') {
      throw new TypeError('pattern required')
    }
    this.pattern = pattern
    this.start = grammar.parse(pattern)
  }

  execute (context) {
    return this._eval([context], this.start)
  }

  _eval (context, [name, ...args]) {
    // console.log('_eval', name, util.inspect(context, {colors: true}))
    const ret = context.reduce((p, c, i) => {
      /* istanbul ignore next */
      if (typeof this[name] !== 'function') {
        throw new Error(`Unimplemented function: "${name}"`)
      }
      return p.concat(this[name](i, c, ...args))
    }, [])
    // console.log('->eval', name, ret)
    return ret
  }

  _root (num, context, relative) {
    const doc = context && context.document
    if (doc) {
      if (relative) {
        return this._eval([doc], relative)
      } else {
        return [doc]
      }
    }
    return []
  }

  _nameTest (num, context, name) {
    if (Array.isArray(context)) {
      // results of _all
      return context.filter(n => (n instanceof dom.Element) && n.name.local === name)
    } else if (context instanceof dom.Document) {
      return [...context.elements(name)]
    } else if (context instanceof dom.Element) {
      return [...context.elements(name)]
    } else if (context instanceof dom.Attribute) {
      if (context.name.local === name) {
        return [context]
      }
    }
    return []
  }

  _nameTestWildcard (num, context, star) {
    /* istanbul ignore next */
    if (star !== '*') {
      throw new Error(`Unimplemented wildcard: "${star}"`)
    }
    if (context instanceof dom.Attribute) {
      return [context]
    } else if (context instanceof dom.Element) {
      return [...context.elements()]
    }
  }

  _relative (num, context, first, steps) {
    return steps.reduce((prevContext, step) => {
      return this._eval(prevContext, step)
    }, this._eval([context], first))
  }

  _step (num, context, slash, expr) {
    if (slash === '//') {
      return this._eval([...context.descendantElements()], expr)
    } else {
      return this._eval([context], expr)
    }
  }

  _attrib (num, context, expr) {
    if (!(context instanceof dom.Element)) {
      throw new Error('Can only take attributes of elements')
    }
    return this._eval(context.att, expr)
  }

  _all (num, context, expr) {
    return this._eval([[...context.descendantElements()]], expr)
  }

  _textTest (num, context) {
    return [context.text()]
  }

  _dot (num, context) {
    return [context]
  }

  _filter (num, context, expr, predicates) {
    return predicates.reduce((prevContext, pred) => {
      return this._eval(prevContext, pred)
    }, this._eval([context], expr))
  }

  _pred (num, context, expr) {
    if (typeof expr === 'number') {
      return (expr === num + 1) ? [context] : []
    } else if (Array.isArray(expr)) {
      return (this._eval([context], expr).length > 0) ? [context] : []
    }
    /* istanbul ignore next */
    throw new Error(`Unimplemented predicate in "${this.pattern}": "${util.inspect(expr)}"`)
  }

  _expr (context, expr) {
    if (Array.isArray(expr)) {
      const ret = this._eval([context], expr).shift()
      if (ret && (typeof ret.text === 'function')) {
        return ret.text()
      }
      return ret
    }
    return expr
  }

  _compare (num, context, left, op, right) {
    const eLeft = this._expr(context, left)
    const eRight = this._expr(context, right)
    switch (op) {
      case '=':
      case 'eq':
        if (eLeft === eRight) {
          return [true]
        }
        break
      default:
        /* istanbul ignore next */
        throw new Error(`Unimplemented op: "${op}"`)
    }
    return []
  }
}
module.exports = XPath
