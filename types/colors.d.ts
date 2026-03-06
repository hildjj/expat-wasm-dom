/**
 * XML escape a string.
 *
 * @param {string} str The string to escape.
 * @param {boolean} [attrib=false] Is the string an attribute value?
 *   (if so, double-quotes are escaped).
 * @returns {string} The escaped string.
 */
export function xmlEscape(str: string, attrib?: boolean): string;
/**
 * Colorize a string, if options.colors is true.
 *
 * @param {string} str String to colorize.
 * @param {symbol|string} type Color.
 * @param {MaybeStylizedSeparated} options Look at color option.
 * @returns {string} Colorized string.
 * @private
 */
export function color(str: string, type: symbol | string, options?: MaybeStylizedSeparated): string;
export const ATTRIBUTE: unique symbol;
export const NAME: unique symbol;
export const PUNCTUATION: unique symbol;
export const TEXT: unique symbol;
export const CLASS: unique symbol;
/**
 * @type {MaybeStylizedSeparated}
 */
export const TOSTRING_OPTS: MaybeStylizedSeparated;
export type MaybeStylized = Partial<import("node:util").InspectOptionsStylized>;
export type Separated = {
    /**
     * How to sort?
     */
    collator?: Intl.Collator | undefined;
    /**
     * Reduce whitespace if true.
     */
    compressed?: boolean | undefined;
    /**
     * Indent by how many spaces?
     */
    indent?: number | undefined;
    /**
     * Indent by text.  Ignores indent.
     */
    indentText?: string | undefined;
    /**
     * Text for newlines.
     */
    newline?: string | undefined;
    /**
     * Pretty print.  Sets other options.
     */
    pretty?: boolean | undefined;
    /**
     * Character to use for quoting attributes.
     */
    quote?: string | undefined;
    /**
     * Remove comments?
     */
    removeComments?: boolean | undefined;
    /**
     * TBD.
     */
    separator?: string | undefined;
    /**
     * Where to break lines.
     */
    width?: number | undefined;
    /**
     * How to wrap lines.
     */
    wrap?: import("@cto.af/linewrap").LineWrap | undefined;
    /**
     * Output HTML instead of ANSI colors.
     */
    html?: boolean | undefined;
};
export type MaybeStylizedSeparated = MaybeStylized & Separated;
