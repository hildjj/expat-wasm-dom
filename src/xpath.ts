import * as grammar from '../lib/xpathPattern3.js';
import {
  Attribute, Comment, Document, Element, Node, ParentNode,
} from './dom.js';
import assert from 'node:assert/strict';
import util from 'node:util';

export type OpFunction = (
  i: number,
  context: Node | Node[], ...others: unknown[]
) => XPathResult;

export type Functor = [OpFunction, ...unknown[]];

/**
 * Error parsing an XPath expression, with prettier output.
 */
export class XPathSyntaxError extends Error {
  public pattern: string;
  public location: grammar.LocationRange | undefined = undefined;

  /**
   * Creates an instance of XPathSyntaxError.
   *
   * @param e Error thrown from peg parser.
   * @param pattern The pattern that was being parsed.
   */
  public constructor(e: Error, pattern: string) {
    super(`Syntax error in "${pattern}": ${e.message}`, {cause: e});
    this.pattern = pattern;

    if (XPathSyntaxError.hasLocation(e)) {
      this.location = e.location;
    }
  }

  public static hasLocation(e: Error): e is XPathSyntaxError {
    return Object.prototype.hasOwnProperty.call(e, 'location');
  }

  /**
   * Format the error for the console.
   *
   * @param _depth How deep can we go?  0 to stop.
   * @param options Inspection options.
   * @returns Colorized string.
   */
  public [util.inspect.custom](
    _depth: number,
    options: util.InspectContext
  ): string {
    if (!options.colors || !options.stylize) {
      return this.toString();
    }
    let ret = 'Error: ';
    if (this.location) {
      ret += this.pattern.slice(0, this.location.start.offset);
      ret += options.stylize(this.pattern.slice(this.location.start.offset, this.location.end.offset), 'regexp');
      ret += this.pattern.slice(this.location.end.offset);
    }
    return ret;
  }
}

export type XPathResultItem = string | number | Node;
export type XPathResult = XPathResultItem[];
export type XPathFun = (...params: XPathResult[]) => XPathResult;

const XPathFunctions: {[key: string]: XPathFun} = {
  count(context) {
    assert(Array.isArray(context));
    return [context.length];
  },
};

/**
 * An XPath expression for querying an XML document.
 */
export class XPath {
  public pattern: string;
  public start: Functor;

  /**
   * Creates an instance of XPath.
   *
   * @param pattern Pattern to compile.
   * @throws Syntax error.
   */
  public constructor(pattern: string) {
    if (typeof pattern !== 'string') {
      throw new TypeError('pattern required');
    }
    this.pattern = pattern;
    try {
      this.start = grammar.parse(pattern, {
        impl: this,
      });
    } catch (e) {
      throw new XPathSyntaxError(e as Error, pattern);
    }
  }

  /**
   * Staring with the given context Node, execute the expression.
   *
   * @param context The DOM Node from which to base the expression's
   *   query.
   * @returns Resuts.
   */
  public execute(context: Node): XPathResult {
    return this.#eval([context], this.start);
  }

  /**
   * Get the root node of the doc.
   *
   * @param _num Unused.
   * @param context What node to start from.
   * @param relative Query to run relative to root.
   * @returns Query result.
   * @private
   */
  public _root(_num: number, context: Node, relative?: Functor): XPathResult {
    const doc = context?.document;
    if (doc) {
      if (relative) {
        return this.#eval([doc], relative);
      }
      return [doc];
    }
    return [];
  }

  /**
   * Child elements with the given name.
   *
   * @param _num Unused.
   * @param context Nodes to query over.
   * @param name Name to query for.
   * @returns Query result.
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  public _nameTest(_num: number, context: Node, name: string): XPathResult {
    if (Array.isArray(context)) {
      // Results of _all
      return context.filter(
        n => (n instanceof Element) && n.name.local === name
      );
    } else if (context instanceof Document) {
      return [...context.elements(name)];
    } else if (context instanceof Element) {
      return [...context.elements(name)];
    } else if (context instanceof Attribute) {
      if (context.name.local === name) {
        return [context];
      }
    }
    return [];
  }

  /**
   * All children, with "star".
   *
   * @param _num Unused.
   * @param context Nodes to query over.
   * @param star Should always be "*" for now.
   * @returns Query result.
   * @throws Bad wildcard.
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  public _nameTestWildcard(
    _num: number,
    context: Node,
    star: string
  ): XPathResult {
    if (star !== '*') {
      throw new Error(`Unimplemented wildcard: "${star}"`);
    }
    if (Array.isArray(context)) {
      return context.filter(e => e instanceof Element);
    } else if (context instanceof Attribute) {
      return [context];
    } else if (context instanceof Element) {
      return [...context.elements()];
    } else if (context instanceof Document) {
      const {root} = context;
      if (!root) {
        throw new Error('Invalid document');
      }
      return [root];
    }
    return [];
  }

  /**
   * Relative to the given context.
   *
   * @param _num Unused.
   * @param context Node to query over.
   * @param first First chunk of relative chain.
   * @param steps Steps to execute.
   * @returns Query result.
   * @private
   */
  public _relative(
    _num: number,
    context: Node,
    first: Functor,
    steps: Functor[]
  ): XPathResult {
    return steps.reduce(
      (prevContext, step) => this.#eval(
        prevContext as Node[], step
      ),
      this.#eval([context], first)
    );
  }

  /**
   * Single- or double-slash steps.
   *
   * @param _num Unused.
   * @param context Parent.
   * @param slash Single or double?
   * @param expr RHS.
   * @returns Query result.
   * @throws Invalid parent.
   * @private
   */
  public _step(
    _num: number,
    context: Node,
    slash: '/' | '//',
    expr: Functor
  ): XPathResult {
    if (slash === '//') {
      if (!(context instanceof ParentNode)) {
        throw new Error('Invalid parent node for //');
      }
      const descendants = [...context.descendantElements()];
      return this.#eval([descendants], expr);
    }
    return this.#eval([context], expr);
  }

  /**
   * Attribute check.
   *
   * @param _num Unused.
   * @param context Nodes to query over.
   * @param expr Expression to check for each attribute.
   * @returns Query result.
   * @throws Not an element.
   * @private
   */
  public _attrib(_num: number, context: Node, expr: Functor): XPathResult {
    if (Array.isArray(context)) {
      return context.reduce((p, v) => {
        if (v instanceof Element) {
          p = p.concat(this.#eval(v.att, expr));
        }
        return p;
      }, []);
    } else if (!(context instanceof Element)) {
      throw new Error('Can only take attributes of elements');
    }
    return this.#eval(context.att, expr);
  }

  /**
   * If "//" at the beginning of the pattern.
   *
   * @param _num Unused.
   * @param context Node to query over.
   * @param expr Expression to apply to all children.
   * @returns Query results.
   * @private
   */
  public _all(_num: number, context: Node, expr: Functor): XPathResult {
    // Example:
    // (fn:root(self::node()) treat as
    //   document-node())/descendant-or-self::node()/
    assert(context instanceof ParentNode, 'Ivalid context for beginning //');
    return this.#eval([[context as Node, ...context.descendants()]], expr);
  }

  /**
   * Retrieve the text from the node.
   *
   * @param _num Unused.
   * @param context Node to query over.
   * @returns Query results.
   * @throws No text.
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  public _textTest(_num: number, context: Node): XPathResult {
    if (typeof context === 'string') {
      return [context];
    }
    if (typeof context.text !== 'function') {
      throw new Error('Cannot get text from this node');
    }
    return [context.text()];
  }

  /**
   * The current node.
   *
   * @param _num Unused.
   * @param context Node to query over.
   * @returns Query results.
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  public _dot(_num: number, context: Node): XPathResult {
    return [context];
  }

  /**
   * Filter a list of nodes with a set of predicates.
   *
   * @param _num Unused.
   * @param context Node to query over.
   * @param expr Expression to check.
   * @param predicates Filters.
   * @returns Query result.
   * @private
   */
  public _filter(
    _num: number,
    context: Node,
    expr: Functor,
    predicates: Functor[]
  ): XPathResult {
    return predicates.reduce(
      (prevContext, pred) => this.#eval(
        prevContext as Node[], pred
      ),
      this.#eval([context], expr)
    );
  }

  /**
   * Predicate.
   *
   * @param num Offset into the list one segment higher.
   * @param context Node to query.
   * @param expr Expression to check.
   * @returns Query results.
   * @throws Unimplemented.
   * @private
   */
  public _pred(
    num: number,
    context: Node,
    expr: number | Functor
  ): XPathResult {
    if (typeof expr === 'number') {
      return (expr === num + 1) ? [context] : [];
    } else if (Array.isArray(expr)) {
      return (this.#eval([context], expr).length > 0) ? [context] : [];
    }

    throw new Error(`Unimplemented predicate in "${this.pattern}": "${util.inspect(expr)}"`);
  }

  /**
   * Process an expression.
   *
   * @param context Node to query.
   * @param expr Expression to check.
   * @returns Query results.
   * @private
   */
  public _expr(context: Node, expr: Functor): XPathResultItem | undefined {
    if (Array.isArray(expr)) {
      const ret = this.#eval([context], expr).shift();

      if (Node.isNode(ret)) {
        return ret.text();
      }
      return ret;
    }
    return expr;
  }

  /**
   * Compare left expression to right expression using operator op.
   *
   * @param _num Ignored.
   * @param context Node to query.
   * @param left LHS.
   * @param op Operator.
   * @param right RHS.
   * @returns Either [true] or [].
   * @throws Unimplemented operation.
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/max-params
  public _compare(
    _num: number,
    context: Node,
    left: Functor,
    op: string,
    right: Functor
  ): boolean[] {
    const eLeft = this._expr(context, left);
    const eRight = this._expr(context, right);
    switch (op) {
      case '=':
      case 'eq':
        if (eLeft === eRight) {
          return [true];
        }
        break;
      case '!=':
      case 'ne':
        if (eLeft !== eRight) {
          return [true];
        }
        break;
      default:
        throw new Error(`Unimplemented op: "${op}"`);
    }
    return [];
  }

  /**
   * Get the parent of the current node.
   *
   * @param _num Unused.
   * @param context Node to query.
   * @returns Query results.
   * @throws No parent.
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  public _parent(_num: number, context: Node): XPathResult {
    if (Array.isArray(context)) {
      return context.reduce((p, v) => {
        if (v.parent) {
          p.push(v);
        }
        return p;
      }, []);
    }
    if (!context.parent) {
      throw new Error('No parent');
    }
    return [context.parent];
  }

  /**
   * Comment in a pattern. Careful no-op.
   *
   * @param _num Unused.
   * @param context Node to query.
   * @returns Query results.
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  public _comment(_num: number, context: Node): XPathResult {
    if (Array.isArray(context)) {
      return context.filter(n => n instanceof Comment);
    } else if (context instanceof ParentNode) {
      return context.children.filter(n => n instanceof Comment);
    }
    return [];
  }

  /**
   * Multiple expressions in parallel.
   *
   * @param _num Unused.
   * @param context Node to query.
   * @param expressions Expressions to check.
   * @returns Query results.
   * @private
   */
  public _comma(
    _num: number,
    context: Node,
    expressions: Functor[]
  ): XPathResult {
    return expressions.reduce(
      (p, v) => p.concat(this.#eval([context], v)),
      [] as XPathResult
    );
  }

  /**
   * Execute functions.
   *
   * @param _num Ignored.
   * @param context Node to query.
   * @param fn Query function name.
   * @param params Parameters for the function.
   * @returns Query result.
   * @throws Unimplemented function.
   * @private
   */
  public _fn(
    _num: number,
    context: Node,
    fn: string,
    params: Functor[]
  ): XPathResult {
    const fun = XPathFunctions[fn];
    if (typeof fun !== 'function') {
      throw new Error(`Unimplemented function: "${fn}"`);
    }

    const eparams = params.map(
      v => this.#eval([context], v)
    );

    return fun.apply(this, eparams);
  }

  /**
   * Some operation that hasn't been implemented yet.
   *
   * @param _num Ignored.
   * @param _context Ignored.
   * @param op Operator.
   * @param _args Ignored.
   * @throws Always.
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  public _unimplemented(
    _num: number,
    _context: Node,
    op: string,
    ..._args: unknown[]
  ): XPathResult {
    throw new Error(`Unimplemented: "${op}"`);
    // Should this be an option?
    // console.error('UNIMPLEMENTED:', op)
    // return []
  }

  /**
   * Evaluate a function within some nodes, concatenating the results.
   *
   * @param context Nodes to evaluate over.
   * @param tor The function and extra parameters to call on each node in
   *   context.
   * @returns Result of query.
   */
  #eval(context: Node[] | Node[][], tor: Functor): XPathResult {
    const [func, ...args] = tor;
    if (typeof func !== 'function') {
      return [func, ...(args as XPathResultItem[])];
    }
    return context.reduce(
      (p, c, i) => {
        const eret = func.call(this, i, c, ...args);
        return p.concat(eret);
      }, [] as XPathResult
    );
  }
}
