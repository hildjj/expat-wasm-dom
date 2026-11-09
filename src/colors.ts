import type {InspectContext} from 'node:util';
import type {LineWrap} from '@cto.af/linewrap';

export const ATTRIBUTE = Symbol('ATTRIBUTE');
export const NAME = Symbol('NAME');
export const PUNCTUATION = Symbol('PUNCTUATION');
export const TEXT = Symbol('TEXT');
export const CLASS = Symbol('CLASS');

/**
 * Extracted from node-inspect-extracted.
 */

const defaultFG = 39;
const defaultBG = 49;

const colors: {[name: string]: [number, number]} = {
  reset: [0, 0],
  bold: [1, 22],
  dim: [2, 22], // Alias: faint
  italic: [3, 23],
  underline: [4, 24],
  blink: [5, 25],
  // Swap foreground and background colors
  inverse: [7, 27], // Alias: swapcolors, swapColors
  hidden: [8, 28], // Alias: conceal
  strikethrough: [9, 29], // Alias: strikeThrough, crossedout, crossedOut
  doubleunderline: [21, 24], // Alias: doubleUnderline
  black: [30, defaultFG],
  red: [31, defaultFG],
  green: [32, defaultFG],
  yellow: [33, defaultFG],
  blue: [34, defaultFG],
  magenta: [35, defaultFG],
  cyan: [36, defaultFG],
  white: [37, defaultFG],
  bgBlack: [40, defaultBG],
  bgRed: [41, defaultBG],
  bgGreen: [42, defaultBG],
  bgYellow: [43, defaultBG],
  bgBlue: [44, defaultBG],
  bgMagenta: [45, defaultBG],
  bgCyan: [46, defaultBG],
  bgWhite: [47, defaultBG],
  framed: [51, 54],
  overlined: [53, 55],
  gray: [90, defaultFG], // Alias: grey, blackBright
  redBright: [91, defaultFG],
  greenBright: [92, defaultFG],
  yellowBright: [93, defaultFG],
  blueBright: [94, defaultFG],
  magentaBright: [95, defaultFG],
  cyanBright: [96, defaultFG],
  whiteBright: [97, defaultFG],
  bgGray: [100, defaultBG], // Alias: bgGrey, bgBlackBright
  bgRedBright: [101, defaultBG],
  bgGreenBright: [102, defaultBG],
  bgYellowBright: [103, defaultBG],
  bgBlueBright: [104, defaultBG],
  bgMagentaBright: [105, defaultBG],
  bgCyanBright: [106, defaultBG],
  bgWhiteBright: [107, defaultBG],
};

const styles: {[name: string | symbol]: keyof typeof colors} = {
  special: 'cyan',
  number: 'yellow',
  bigint: 'yellow',
  boolean: 'yellow',
  undefined: 'gray',
  null: 'bold',
  string: 'green',
  symbol: 'green',
  date: 'magenta',
  regexp: 'red',
  module: 'underline',
  [ATTRIBUTE]: 'blue',
  [CLASS]: 'red',
  [NAME]: 'green',
  [PUNCTUATION]: 'bold',
  [TEXT]: 'magenta',
};

/**
 * Wrap a string with ANSI escapes to colorize it.
 *
 * @param str String to colorize.
 * @param styleType What color to use?
 * @returns Colorized string.
 * @private
 */
function colorizeANSI(str: string, styleType: symbol | string): string {
  const style = styles[styleType];
  if (style) {
    const col = colors[style];
    if (col) {
      return `\u001b[${col[0]}m${str}\u001b[${col[1]}m`;
    }
  }
  return str;
}

/**
 * XML escape a string.
 *
 * @param str The string to escape.
 * @param attrib Is the string an attribute value?
 *   (if so, double-quotes are escaped).
 * @returns The escaped string.
 */
export function xmlEscape(str: string, attrib = false): string {
  const re = attrib ? /[<&"']/g : /[<&]/g;
  const ret = str.replace(re, c => {
    switch (c) {
      case '<': return '&lt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default:
        /* c8 ignore next */
        return c; // Not reachable
    }
  });
  // See: https://www.w3.org/TR/xml/#NT-CharData
  return attrib ? ret : ret.replace(/]]>/g, ']]&gt;');
}

/**
 * Stylize using HTML markup.
 *
 * @param str String to colorize.
 * @param styleType What color to use?
 * @returns Colorized string.
 * @private
 */
function colorizeHTML(str: string, styleType: symbol | string): string {
  const style = styles[styleType];
  if (style) {
    const st = style === 'bold' ? 'font-weight:bold' : `color:${style}`;
    return `<span style='${st}'>${xmlEscape(str)}</span>`;
  }
  return str;
}

export type MaybeStylized = Partial<InspectContext>;

export interface Separated {
  /** How to sort? */
  collator?: Intl.Collator;

  /**
   * Reduce whitespace if true.
   * @default false
   */
  compressed?: boolean;

  /**
   * Indent by how many spaces?
   * @default 0
   */
  indent?: number;

  /**
   * Indent by text.  Ignores indent.
   * @default "  "
   */
  indentText?: string;

  /**
   * Text for newlines.
   * @default "\n"
   */
  newline?: string;

  /**
   * Pretty print.  Sets other options.
   * @default false
   */
  pretty?: boolean;

  /**
   * Character to use for quoting attributes.
   * @default "'"
   */
  quote?: string;

  /**
   * Remove comments?
   * @default false
   */
  removeComments?: boolean;

  /**
   * TBD.
   * @default ''
   */
  separator?: string;

  /**
   * Where to break lines.
   * @default 80
   */
  width?: number;

  /**
   * How to wrap lines.
   */
  wrap?: LineWrap;

  /**
   * Output HTML instead of ANSI colors.
   * @default false
   */
  html?: boolean;
}

export type MaybeStylizedSeparated = MaybeStylized & Separated;

export const DEFAULT_COLLATOR = new Intl.Collator();

export const TOSTRING_OPTS: MaybeStylizedSeparated = {
  // Default options for toString()

  collator: DEFAULT_COLLATOR,
  colors: false,
  compressed: false,
  depth: Infinity,
  indent: 0,
  indentText: '  ',
  newline: '\n',
  pretty: false,
  quote: "'",
  removeComments: false,
  width: 80,
  html: false,
  wrap: undefined,
};

/**
 * Colorize a string, if options.colors is true.
 *
 * @param str String to colorize.
 * @param type Color.
 * @param options Look at color option.
 * @returns Colorized string.
 * @private
 */
export function color(
  str: string,
  type: symbol | string,
  options: MaybeStylizedSeparated = TOSTRING_OPTS
): string {
  if (options.colors) {
    const st = options.html ? colorizeHTML : colorizeANSI;
    return st(str, type);
  }
  return str;
}
