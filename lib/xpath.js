import * as dom from './dom.js'
import * as grammar from './xpathPattern3.js'
import util from 'util'

/**
 * Error parsing an XPath expression, with prettier output.
 *
 * @extends {Error}
 */
export class XPathSyntaxError extends Error {
  /**
   * Creates an instance of XPathSyntaxError.
   *
   * @param {Error} e Error thrown from peg parser
   * @param {string} pattern The pattern that was being parsed
   */
  constructor(e, pattern) {
    super(`Syntax error in "${pattern}": ${e.message}`, {cause: e})
    this.pattern = pattern
    // @ts-ignore
    if (e.location) {
      // @ts-ignore
      this.location = e.location
    }
  }

  /**
   * Format the error for the console.
   *
   * @param {number} depth How deep can we go?  0 to stop.
   * @param {util.InspectOptionsStylized} options Inspection options
   * @returns {string}
   */
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
 * @typedef {Array<string|number|dom.Node>} XPathResult
 */

/**
 * @callback XPathFun
 * @param {...XPathResult} params
 * @return {XPathResult}
 */

/**
 * @type {Record<string,XPathFun>}
 */
const XPathFunctions = {
  count(context) {
    return [context.length]
  },
}

/**
 * An XPath expression for querying an XML document
 */
export class XPath {
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
      throw new XPathSyntaxError(/** @type {Error} */(e), pattern)
    }
  }

  /**
   * Staring with the given context Node, execute the expression
   *
   * @param {dom.Node} context The DOM Node from which to base the expression's
   *   query
   * @returns {XPathResult} resuts
   */
  execute(context) {
    return this._eval([context], this.start)
  }

  /**
   * @callback OpFunction
   * @param {number} i The offset into the context nodes list
   * @param {dom.Node} context The current context node
   * @param {...any} args Extra arguments for the function
   * @returns {XPathResult}
   * @private
   */

  /**
   * @jsdoc-remove-next-tag
   * @typedef {[OpFunction, ...any]} Functor
   */

  /**
   * Evaluate a function within some nodes, concatenating the results.
   *
   * @param {dom.Node[]} context
   * @param {Functor} functor The function and extra arguments to
   *   call on each node in context
   * @returns {XPathResult}
   * @private
   */
  _eval(context, [func, ...args]) {
    if (typeof func !== 'function') {
      return [func, ...args]
    }
    return context.reduce(
      (p, c, i) => {
        const eret = func.call(this, i, c, ...args)
        return p.concat(eret)
      }, /** @type {XPathResult} */([])
    )
  }

  /**
   * Get the root node of the doc
   *
   * @param {number} num Unused
   * @param {dom.Node} context What node to start from
   * @param {Functor} [relative] Query to run relative to root
   * @returns {XPathResult}
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
   * Child elements with the given name.
   *
   * @param {number} num Unused
   * @param {dom.Node} context
   * @param {string} name
   * @returns {XPathResult}
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
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
   * All children, with "star".
   *
   * @param {number} num Unused
   * @param {dom.Node} context
   * @param {string} star Should always be "*" for now.
   * @returns {XPathResult}
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  _nameTestWildcard(num, context, star) {
    if (star !== '*') {
      throw new Error(`Unimplemented wildcard: "${star}"`)
    }
    if (Array.isArray(context)) {
      return context.filter(e => e instanceof dom.Element)
    } else if (context instanceof dom.Attribute) {
      return [context]
    } else if (context instanceof dom.Element) {
      return [...context.elements()]
    } else if (context instanceof dom.Document) {
      const {root} = context
      if (!root) {
        throw new Error('Invalid document')
      }
      return [root]
    }
    return []
  }

  /**
   * Relative to the given context
   *
   * @param {number} num Unused
   * @param {dom.Node} context
   * @param {Functor} first First chunk of relative chain
   * @param {Functor[]} steps
   * @returns {XPathResult}
   * @private
   */
  _relative(num, context, first, steps) {
    return steps.reduce(
      (prevContext, step) => this._eval(
        /** @type {dom.Node[]} */ (prevContext), step
      ),
      this._eval([context], first)
    )
  }

  /**
   * Single- or double-slash steps.
   *
   * @param {number} num Unused
   * @param {dom.Node} context Parent
   * @param {"/"|"//"} slash Single or double?
   * @param {Functor} expr RHS
   * @returns {XPathResult}
   * @private
   */
  _step(num, context, slash, expr) {
    if (slash === '//') {
      if (!(context instanceof dom.ParentNode)) {
        throw new Error('Invalid parent node for //')
      }
      const descendants = [...context.descendantElements()]
      // @ts-ignore -- I don't understand this one
      return this._eval([descendants], expr)
    }
    return this._eval([context], expr)
  }

  /**
   * Attribute check
   *
   * @param {number} num Unused
   * @param {dom.Node} context
   * @param {Functor} expr
   * @returns {XPathResult}
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
   * "//" at the beginning of the pattern.
   *
   * @param {number} num Unused
   * @param {dom.Node} context
   * @param {Functor} expr
   * @returns {XPathResult}
   * @private
   */
  _all(num, context, expr) {
    // Example:
    // (fn:root(self::node()) treat as
    //   document-node())/descendant-or-self::node()/
    if (!(context instanceof dom.ParentNode)) {
      throw new Error('Ivalid context for beginning //')
    }
    // @ts-ignore -- Don't understand this either
    return this._eval([[context, ...context.descendants()]], expr)
  }

  /**
   * Retrieve the text from the node.
   *
   * @param {number} num Unused
   * @param {dom.Node} context
   * @returns {XPathResult}
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  _textTest(num, context) {
    if (typeof context === 'string') {
      return [context]
    }
    if (typeof context.text !== 'function') {
      throw new Error('Cannot get text from this node')
    }
    return [context.text()]
  }

  /**
   * The current node.
   *
   * @param {number} num Unused
   * @param {dom.Node} context
   * @returns {XPathResult}
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  _dot(num, context) {
    return [context]
  }

  /**
   * Filter a list of nodes with a set of predicates.
   *
   * @param {number} num Unused
   * @param {dom.Node} context
   * @param {Functor} expr
   * @param {Functor[]} predicates
   * @returns {XPathResult}
   * @private
   */
  _filter(num, context, expr, predicates) {
    return predicates.reduce(
      (prevContext, pred) => this._eval(
        /** @type {dom.Node[]} */ (prevContext), pred
      ),
      this._eval([context], expr)
    )
  }

  /**
   *
   * @param {number} num Offset into the list one segment higher
   * @param {dom.Node} context
   * @param {number|Functor} expr
   * @returns {XPathResult}
   * @private
   */
  _pred(num, context, expr) {
    if (typeof expr === 'number') {
      return (expr === num + 1) ? [context] : []
    } else if (Array.isArray(expr)) {
      return (this._eval([context], expr).length > 0) ? [context] : []
    }

    throw new Error(`Unimplemented predicate in "${this.pattern}": "${util.inspect(expr)}"`)
  }

  /**
   * Process an expression
   *
   * @param {dom.Node} context
   * @param {Functor} expr
   * @returns {string|number|dom.Node|undefined}
   * @private
   */
  _expr(context, expr) {
    if (Array.isArray(expr)) {
      const ret = this._eval([context], expr).shift()
      // @ts-ignore
      if (ret && (typeof ret.text === 'function')) {
        // @ts-ignore
        return ret.text()
      }
      return ret
    }
    return expr
  }

  /**
   * Compare left expression to right expression using operator op.
   *
   * @param {number} num
   * @param {dom.Node} context
   * @param {Functor} left
   * @param {string} op
   * @param {Functor} right
   * @returns {boolean[]}
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
      case '!=':
      case 'ne':
        if (eLeft !== eRight) {
          return [true]
        }
        break
      default:
        throw new Error(`Unimplemented op: "${op}"`)
    }
    return []
  }

  /**
   * Get the parent of the current node.
   *
   * @param {number} num Unused
   * @param {dom.Node} context
   * @returns {XPathResult}
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  _parent(num, context) {
    if (Array.isArray(context)) {
      return context.reduce((p, v) => {
        if (v.parent) {
          p.push(v)
        }
        return p
      }, [])
    }
    if (!context.parent) {
      throw new Error('No parent')
    }
    return [context.parent]
  }

  /**
   * Comment in a pattern. Careful no-op.
   *
   * @param {number} num Unused
   * @param {dom.Node} context
   * @returns {XPathResult}
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  _comment(num, context) {
    if (Array.isArray(context)) {
      return context.filter(n => n instanceof dom.Comment)
    } else if (context instanceof dom.ParentNode) {
      return context.children.filter(n => n instanceof dom.Comment)
    }
    return []
  }

  /**
   * Multiple expressions in parallel.
   *
   * @param {number} num Unused
   * @param {dom.Node} context
   * @param {Functor[]} expressions
   * @returns {XPathResult}
   * @private
   */
  _comma(num, context, expressions) {
    return expressions.reduce(
      (p, v) => p.concat(this._eval([context], v)),
      /** @type {XPathResult} */ ([])
    )
  }

  /**
   * Execute functions.
   *
   * @param {number} num
   * @param {dom.Node} context
   * @param {string} fn
   * @param {Functor[]} params
   * @returns {XPathResult}
   * @private
   */
  _fn(num, context, fn, params) {
    const fun = XPathFunctions[fn]
    if (typeof fun !== 'function') {
      throw new Error(`Unimplemented function: "${fn}"`)
    }

    const eparams = params.map(
      v => this._eval([context], v)
    )

    return fun.apply(this, eparams)
  }

  /**
   * Some operation that hasn't been implemented yet.
   *
   * @param {number} num
   * @param {dom.Node} context
   * @param {string} op
   * @param  {...any} args
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  _unimplemented(num, context, op, ...args) {
    throw new Error(`Unimplemented: "${op}"`)
    // Should this be an option?
    // console.error('UNIMPLEMENTED:', op)
    // return []
  }
}
