/**
 * Error parsing an XPath expression, with prettier output.
 *
 * @extends {Error}
 */
export class XPathSyntaxError extends Error {
    /**
     * Creates an instance of XPathSyntaxError.
     *
     * @param {Error} e Error thrown from peg parser.
     * @param {string} pattern The pattern that was being parsed.
     */
    constructor(e: Error, pattern: string);
    pattern: string;
    location: any;
    /**
     * Format the error for the console.
     *
     * @param {number} _depth How deep can we go?  0 to stop.
     * @param {util.InspectOptionsStylized} options Inspection options.
     * @returns {string} Colorized string.
     */
    [util.inspect.custom](_depth: number, options: util.InspectOptionsStylized): string;
}
/**
 * An XPath expression for querying an XML document.
 */
export class XPath {
    /**
     * Creates an instance of XPath.
     *
     * @param {string} pattern Pattern to compile.
     * @throws {TypeError} Not a string.
     * @throws {XPathSyntaxError} Invalid syntax in the pattern.
     */
    constructor(pattern: string);
    pattern: string;
    start: any;
    /**
     * Staring with the given context Node, execute the expression.
     *
     * @param {dom.Node} context The DOM Node from which to base the expression's
     *   query.
     * @returns {XPathResult} Resuts.
     */
    execute(context: dom.Node): XPathResult;
    /**
     * Get the root node of the doc.
     *
     * @param {number} _num Unused.
     * @param {dom.Node} context What node to start from.
     * @param {Functor} [relative] Query to run relative to root.
     * @returns {XPathResult} Query result.
     * @private
     */
    private _root;
    /**
     * Child elements with the given name.
     *
     * @param {number} _num Unused.
     * @param {dom.Node} context Nodes to query over.
     * @param {string} name Name to query for.
     * @returns {XPathResult} Query result.
     * @private
     */
    private _nameTest;
    /**
     * All children, with "star".
     *
     * @param {number} _num Unused.
     * @param {dom.Node} context Nodes to query over.
     * @param {string} star Should always be "*" for now.
     * @returns {XPathResult} Query result.
     * @throws {Error} Invalid document.
     * @private
     */
    private _nameTestWildcard;
    /**
     * Relative to the given context.
     *
     * @param {number} _num Unused.
     * @param {dom.Node} context Node to query over.
     * @param {Functor} first First chunk of relative chain.
     * @param {Functor[]} steps Steps to execute.
     * @returns {XPathResult} Query result.
     * @private
     */
    private _relative;
    /**
     * Single- or double-slash steps.
     *
     * @param {number} _num Unused.
     * @param {dom.Node} context Parent.
     * @param {"/"|"//"} slash Single or double?
     * @param {Functor} expr RHS.
     * @returns {XPathResult} Query result.
     * @throws {Error} Invalid parent node.
     * @private
     */
    private _step;
    /**
     * Attribute check.
     *
     * @param {number} _num Unused.
     * @param {dom.Node} context Nodes to query over.
     * @param {Functor} expr Expression to check for each attribute.
     * @returns {XPathResult} Query result.
     * @throws {Error} Context isn't Element.
     * @private
     */
    private _attrib;
    /**
     * If "//" at the beginning of the pattern.
     *
     * @param {number} _num Unused.
     * @param {dom.Node} context Node to query over.
     * @param {Functor} expr Expression to apply to all children.
     * @returns {XPathResult} Query results.
     * @throws {Error} Invalid context.
     * @private
     */
    private _all;
    /**
     * Retrieve the text from the node.
     *
     * @param {number} _num Unused.
     * @param {dom.Node} context Node to query over.
     * @returns {XPathResult} Query results.
     * @throws {Error} No text.
     * @private
     */
    private _textTest;
    /**
     * The current node.
     *
     * @param {number} _num Unused.
     * @param {dom.Node} context Node to query over.
     * @returns {XPathResult} Query results.
     * @private
     */
    private _dot;
    /**
     * Filter a list of nodes with a set of predicates.
     *
     * @param {number} _num Unused.
     * @param {dom.Node} context Node to query over.
     * @param {Functor} expr Expression to check.
     * @param {Functor[]} predicates Filters.
     * @returns {XPathResult} Query result.
     * @private
     */
    private _filter;
    /**
     * Predicate.
     *
     * @param {number} num Offset into the list one segment higher.
     * @param {dom.Node} context Node to query.
     * @param {number|Functor} expr Expression to check.
     * @returns {XPathResult} Query results.
     * @throws {Error} Unimplemented predicate.
     * @private
     */
    private _pred;
    /**
     * Process an expression.
     *
     * @param {dom.Node} context Node to query.
     * @param {Functor} expr Expression to check.
     * @returns {string|number|dom.Node|undefined} Query results.
     * @private
     */
    private _expr;
    /**
     * Compare left expression to right expression using operator op.
     *
     * @param {number} _num Ignored.
     * @param {dom.Node} context Node to query.
     * @param {Functor} left LHS.
     * @param {string} op Operator.
     * @param {Functor} right RHS.
     * @returns {boolean[]} Either [true] or [].
     * @throws {Error} Unimplemented operation.
     * @private
     */
    private _compare;
    /**
     * Get the parent of the current node.
     *
     * @param {number} _num Unused.
     * @param {dom.Node} context Node to query.
     * @returns {XPathResult} Query results.
     * @throws {Error} No parent.
     * @private
     */
    private _parent;
    /**
     * Comment in a pattern. Careful no-op.
     *
     * @param {number} _num Unused.
     * @param {dom.Node} context Node to query.
     * @returns {XPathResult} Query results.
     * @private
     */
    private _comment;
    /**
     * Multiple expressions in parallel.
     *
     * @param {number} _num Unused.
     * @param {dom.Node} context Node to query.
     * @param {Functor[]} expressions Expressions to check.
     * @returns {XPathResult} Query results.
     * @private
     */
    private _comma;
    /**
     * Execute functions.
     *
     * @param {number} _num Ignored.
     * @param {dom.Node} context Node to query.
     * @param {string} fn Query function name.
     * @param {Functor[]} params Parameters for the function.
     * @returns {XPathResult} Query result.
     * @throws {Error} Unimplemented function.
     * @private
     */
    private _fn;
    /**
     * Some operation that hasn't been implemented yet.
     *
     * @param {number} _num Ignored.
     * @param {dom.Node} _context Ignored.
     * @param {string} op Operator.
     * @param {...any} _args Ignored.
     * @throws {Error} Always throws.
     * @private
     */
    private _unimplemented;
    #private;
}
export type XPathResult = Array<string | number | dom.Node>;
export type XPathFun = (...params: XPathResult[]) => XPathResult;
import util from 'node:util';
import * as dom from './dom.js';
