import * as dom from './dom.js'
import * as grammar from './xpathPattern3.js'
import util from 'util'

/**
 * Error parsing an XPath expression, with prettier output.
 *
 * @extends {Error}
 */
class XPathSyntaxError extends Error {
  /**
   * Creates an instance of XPathSyntaxError.
   *
   * @param {Error} error Error thrown from peg parser
   * @param {string} pattern The pattern that was being parsed
   */
  constructor(e, pattern) {
    super(`Syntax error in "${pattern}": ${e.message}`)
    this.pattern = pattern
    this.location = e.location
  }

  [util.inspect.custom](depth, options) {
    if (!options.colors || !options.stylize) {
      return this.toString()
    }
    let ret = 'Error: '
    ret += this.pattern.slice(0, this.location.start.offset)
    ret += options.stylize(this.pattern.slice(this.location.start.offset, this.location.end.offset), 'regexp')
    ret += this.pattern.slice(this.location.end.offset)
    return ret
  }
}

/**
 * An XPath expression for querying an XML document
 */
export default class XPath {
  /**
   * Creates an instance of XPath.
   *
   * @param {string} pattern
   * @throws {TypeError} Not a string
   * @throws {XPathSyntaxError} Invalid syntax in the pattern
   */
  constructor(pattern) {
    if (typeof pattern !== 'string') {
      throw new TypeError('pattern required')
    }
    this.pattern = pattern
    try {
      this.start = grammar.parse(pattern, {
        impl: this,
      })
    } catch (e) {
      throw new XPathSyntaxError(e, pattern)
    }
  }

  /**
   * Staring with the given context Node, execute the expression
   *
   * @param {Node} context The DOM Node from which to base the expression's
   *   query
   * @returns {Array<Node|string>} resuts
   */
  execute(context) {
    return this._eval([context], this.start)
  }

  /**
   * @private
   */
  _eval(context, [func, ...args]) {
    if (typeof func !== 'function') {
      return [func, ...args]
    }
    const ret = context.reduce(
      (p, c, i) => {
        const eret = func.call(this, i, c, ...args)
        return p.concat(eret)
      }, []
    )
    return ret
  }

  /**
   * @private
   */
  _root(num, context, relative) {
    const doc = context && context.document
    if (doc) {
      if (relative) {
        return this._eval([doc], relative)
      }
      return [doc]
    }
    return []
  }

  /**
   * @private
   */
  _nameTest(num, context, name) {
    if (Array.isArray(context)) {
      // Results of _all
      return context.filter(
        n => (n instanceof dom.Element) && n.name.local === name
      )
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

  /**
   * @private
   */
  _nameTestWildcard(num, context, star) {
    /* c8 ignore next */
    if (star !== '*') {
      throw new Error(`Unimplemented wildcard: "${star}"`)
    }
    if (Array.isArray(context)) {
      return context
    } else if (context instanceof dom.Attribute) {
      return [context]
    } else if (context instanceof dom.Element) {
      return [...context.elements()]
    } else if (context instanceof dom.Document) {
      return [context.root]
    }
    return []
  }

  /**
   * @private
   */
  _relative(num, context, first, steps) {
    return steps.reduce(
      (prevContext, step) => {
        const ret = this._eval(prevContext, step)
        return ret
      },
      this._eval([context], first)
    )
  }

  /**
   * @private
   */
  _step(num, context, slash, expr) {
    if (slash === '//') {
      return this._eval([[...context.descendantElements()]], expr)
    }
    return this._eval([context], expr)
  }

  /**
   * @private
   */
  _attrib(num, context, expr) {
    if (Array.isArray(context)) {
      return context.reduce((p, v) => {
        if (v instanceof dom.Element) {
          p = p.concat(this._eval(v.att, expr))
        }
        return p
      }, [])
    } else if (!(context instanceof dom.Element)) {
      throw new Error('Can only take attributes of elements')
    }
    return this._eval(context.att, expr)
  }

  /**
   * @private
   */
  _all(num, context, expr) {
    // Example:
    // (fn:root(self::node()) treat as
    //   document-node())/descendant-or-self::node()/
    return this._eval([[context, ...context.descendants()]], expr)
  }

  /**
   * @private
   */
  _textTest(num, context) {
    return [context.text()]
  }

  /**
   * @private
   */
  _dot(num, context) {
    return [context]
  }

  /**
   * @private
   */
  _filter(num, context, expr, predicates) {
    return predicates.reduce(
      (prevContext, pred) => this._eval(prevContext, pred),
      this._eval([context], expr)
    )
  }

  /**
   * @private
   */
  _pred(num, context, expr) {
    if (typeof expr === 'number') {
      return (expr === num + 1) ? [context] : []
    } else if (Array.isArray(expr)) {
      return (this._eval([context], expr).length > 0) ? [context] : []
    }
    /* istanbul ignore next */
    throw new Error(`Unimplemented predicate in "${this.pattern}": "${util.inspect(expr)}"`)
  }

  /**
   * @private
   */
  _expr(context, expr) {
    if (Array.isArray(expr)) {
      const ret = this._eval([context], expr).shift()
      if (ret && (typeof ret.text === 'function')) {
        return ret.text()
      }
      return ret
    }
    return expr
  }

  /**
   * @private
   */
  // eslint-disable-next-line max-params
  _compare(num, context, left, op, right) {
    const eLeft = this._expr(context, left)
    const eRight = this._expr(context, right)
    switch (op) {
      case '=':
      case 'eq':
        if (eLeft === eRight) {
          return [true]
        }
        break
      /* istanbul ignore next */
      default:
        throw new Error(`Unimplemented op: "${op}"`)
    }
    return []
  }

  /**
   * @private
   */
  _parent(num, context) {
    if (Array.isArray(context)) {
      return context.reduce((p, v) => {
        if (v.parent) {
          p.push(v)
        }
        return p
      }, [])
    }
    return [context.parent]
  }

  /**
   * @private
   */
  _comment(num, context) {
    if (context instanceof dom.Comment) {
      return [context]
    } else if (Array.isArray(context)) {
      return context.filter(n => n instanceof dom.Comment)
    } else if (context.children) {
      return context.children.filter(n => n instanceof dom.Comment)
    }
    return []
  }

  /**
   * @private
   */
  _comma(num, context, expressions) {
    return expressions.reduce((p, v) => p.concat(this._eval([context], v)), [])
  }

  /**
   * @private
   */
  /* istanbul ignore next */
  _unimplemented(num, context, op, ...args) {
    throw new Error(`Unimplemented: "${op}"`)
    // Should this be an option?
    // console.error('UNIMPLEMENTED:', op)
    // return []
  }
}
