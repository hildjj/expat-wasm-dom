export declare const ATTRIBUTE: unique symbol;
export declare const NAME: unique symbol;
export declare const PUNCTUATION: unique symbol;
export declare const TEXT: unique symbol;
export declare const CLASS: unique symbol;
/**
 * XML escape a string.
 *
 * @param {string} str The string to escape.
 * @param {boolean} [attrib=false] Is the string an attribute value?
 *   (if so, double-quotes are escaped).
 * @returns {string} The escaped string.
 */
export declare function xmlEscape(str: string, attrib?: boolean): string;
export type MaybeStylized = Partial<import('node:util').InspectContext>;
export type Separated = {
    /**
     * How to sort?
     */
    collator?: Intl.Collator;
    /**
     * Reduce whitespace if true.
     */
    compressed?: boolean;
    /**
     * Indent by how many spaces?
     */
    indent?: number;
    /**
     * Indent by text.  Ignores indent.
     */
    indentText?: string;
    /**
     * Text for newlines.
     */
    newline?: string;
    /**
     * Pretty print.  Sets other options.
     */
    pretty?: boolean;
    /**
     * Character to use for quoting attributes.
     */
    quote?: string;
    /**
     * Remove comments?
     */
    removeComments?: boolean;
    /**
     * TBD.
     */
    separator?: string;
    /**
     * Where to break lines.
     */
    width?: number;
    /**
     * How to wrap lines.
     */
    wrap?: import('@cto.af/linewrap').LineWrap;
    /**
     * Output HTML instead of ANSI colors.
     */
    html?: boolean;
};
export type MaybeStylizedSeparated = MaybeStylized & Separated;
/**
 * @type {MaybeStylizedSeparated}
 */
export declare const TOSTRING_OPTS: MaybeStylizedSeparated;
/**
 * Colorize a string, if options.colors is true.
 *
 * @param {string} str String to colorize.
 * @param {symbol|string} type Color.
 * @param {MaybeStylizedSeparated} options Look at color option.
 * @returns {string} Colorized string.
 * @private
 */
export declare function color(str: string, type: symbol | string, options?: MaybeStylizedSeparated): string;
