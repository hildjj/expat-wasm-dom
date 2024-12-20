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
    constructor(e: Error, pattern: string);
    pattern: string;
    location: any;
    /**
     * Format the error for the console.
     *
     * @param {number} depth How deep can we go?  0 to stop.
     * @param {util.InspectOptionsStylized} options Inspection options
     * @returns {string}
     */
    [util.inspect.custom](depth: number, options: util.InspectOptionsStylized): string;
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
    constructor(pattern: string);
    pattern: string;
    start: any;
    /**
     * Staring with the given context Node, execute the expression
     *
     * @param {dom.Node} context The DOM Node from which to base the expression's
     *   query
     * @returns {XPathResult} resuts
     */
    execute(context: dom.Node): XPathResult;
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
    private _eval;
    /**
     * Get the root node of the doc
     *
     * @param {number} num Unused
     * @param {dom.Node} context What node to start from
     * @param {Functor} [relative] Query to run relative to root
     * @returns {XPathResult}
     * @private
     */
    private _root;
    /**
     * Child elements with the given name.
     *
     * @param {number} num Unused
     * @param {dom.Node} context
     * @param {string} name
     * @returns {XPathResult}
     * @private
     */
    private _nameTest;
    /**
     * All children, with "star".
     *
     * @param {number} num Unused
     * @param {dom.Node} context
     * @param {string} star Should always be "*" for now.
     * @returns {XPathResult}
     * @private
     */
    private _nameTestWildcard;
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
    private _relative;
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
    private _step;
    /**
     * Attribute check
     *
     * @param {number} num Unused
     * @param {dom.Node} context
     * @param {Functor} expr
     * @returns {XPathResult}
     * @private
     */
    private _attrib;
    /**
     * "//" at the beginning of the pattern.
     *
     * @param {number} num Unused
     * @param {dom.Node} context
     * @param {Functor} expr
     * @returns {XPathResult}
     * @private
     */
    private _all;
    /**
     * Retrieve the text from the node.
     *
     * @param {number} num Unused
     * @param {dom.Node} context
     * @returns {XPathResult}
     * @private
     */
    private _textTest;
    /**
     * The current node.
     *
     * @param {number} num Unused
     * @param {dom.Node} context
     * @returns {XPathResult}
     * @private
     */
    private _dot;
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
    private _filter;
    /**
     *
     * @param {number} num Offset into the list one segment higher
     * @param {dom.Node} context
     * @param {number|Functor} expr
     * @returns {XPathResult}
     * @private
     */
    private _pred;
    /**
     * Process an expression
     *
     * @param {dom.Node} context
     * @param {Functor} expr
     * @returns {string|number|dom.Node|undefined}
     * @private
     */
    private _expr;
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
    private _compare;
    /**
     * Get the parent of the current node.
     *
     * @param {number} num Unused
     * @param {dom.Node} context
     * @returns {XPathResult}
     * @private
     */
    private _parent;
    /**
     * Comment in a pattern. Careful no-op.
     *
     * @param {number} num Unused
     * @param {dom.Node} context
     * @returns {XPathResult}
     * @private
     */
    private _comment;
    /**
     * Multiple expressions in parallel.
     *
     * @param {number} num Unused
     * @param {dom.Node} context
     * @param {Functor[]} expressions
     * @returns {XPathResult}
     * @private
     */
    private _comma;
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
    private _fn;
    /**
     * Some operation that hasn't been implemented yet.
     *
     * @param {number} num
     * @param {dom.Node} context
     * @param {string} op
     * @param  {...any} args
     * @private
     */
    private _unimplemented;
}
export type XPathResult = Array<string | number | dom.Node>;
export type XPathFun = (...params: XPathResult[]) => XPathResult;
import util from 'util';
import * as dom from './dom.js';
