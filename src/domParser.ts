import * as dom from './dom.js';
import type {Buffer} from 'node:buffer';
import {NS} from './ns.js';
import {XmlParser} from 'expat-wasm';
import assert from 'node:assert/strict';

/** Encodings that expat supports. */
export type XML_Encoding = undefined | null | 'US-ASCII' | 'UTF-8' | 'UTF-16' | 'ISO-8859-1';

export interface EntityInfo {
  /** Base URL. */
  base: string;

  /** Resolved Data. */
  data: string | Buffer | Uint8Array | Uint8ClampedArray;
}

export type ReadEntity = (
  base: string, systemID: string, publicId?: string
) => EntityInfo;

export interface ParserOptions {
  /** If null will do content sniffing. */
  encoding?: XML_Encoding;

  /**
   * The separator for namespace URI and element/attribute name.  Use
   * XmlParser.NO_NAMESPACES to get Expat's old, broken namespace
   * non-implementation via XmlParserCreate instead of XmlParserCreateNS.
   * @default '|'
   */
  separator?: string | typeof XmlParser.NO_NAMESPACES;

  /** Expand internal entities. */
  expandInternalEntities?: boolean;

  /** Expand external entities using this callback. */
  systemEntity?: ReadEntity | null;

  /** Base URI for inclusions. */
  base?: string | null;

  /** Add xml:base attributes when parsing external entitites. */
  xmlBase?: boolean;
}

/**
 * Parse XML text to a Document Object Model.
 *
 * You should call .destroy() when done, or you will leak memory from
 * the parser WASM instance.
 */
export class DomParser {
  #document = new dom.Document();
  #lastElName: string | null = null;
  #lastError: Error | null = null;
  #pendingNS: string[][] = [];
  #cur: dom.ParentNode = this.#document;
  #parser: XmlParser | null = null;
  #base: string[] = [];
  #baseParent: dom.ParentNode[] = [];

  /**
   * Create a DOM Parser.
   *
   * @param options Encoding to expect from Buffers/etc that are passed to
   *   parse().
   * @throws Base is required.
   */
  public constructor(options?: ParserOptions) {
    this.#parser = new XmlParser(options);

    if (options?.xmlBase) {
      if (!options?.base) {
        throw new Error('Must specify "base" option to turn on xmlBase');
      }
      this.#base.push(options.base);
      this.#baseParent.push(this.#document);
      this.#parser.on('startBase', base => {
        this.#base.push(base);
        this.#baseParent.push(this.#cur);
      });
      this.#parser.on('endBase', base => {
        const old = this.#base.pop();

        /* c8 ignore start */
        // This is a belt-and-suspenders assertion.  Should not be possible.
        if (old !== base) {
          this.#lastError = new Error(`Invalid base "${base}" != "${old}"`);
          this.#parser?.stop();
        }

        /* c8 ignore stop */
        this.#baseParent.pop();
      });
    }

    this.#parser.on('startNamespaceDecl', (prefix, uri) => {
      this.#pendingNS.push([prefix, uri]);
    });
    this.#parser.on('startElement', (nm, at) => {
      assert(this.#parser);
      const par = this.#parser;
      const pairs: dom.AttributePair[] =
        Object.entries(at).map(([k, v]) => [par.triple(k), v]);
      const el = new dom.Element(
        par.triple(nm),
        pairs,
        this.#pendingNS
      );
      this.#pendingNS = [];

      if (
        options?.xmlBase &&
        (this.#baseParent.length > 0) &&
        (this.#cur === this.#baseParent[this.#baseParent.length - 1])
      ) {
        el.setAttribute({
          prefix: 'xml',
          local: 'base',
          ns: NS.XML,
        }, this.#base[this.#base.length - 1]);
      }
      this.#cur.add(el);
      this.#cur = el;
    });
    this.#parser.on('endElement', () => {
      this.#cur = this.#cur.parent as dom.ParentNode;
    });
    this.#parser.on('characterData', txt => {
      const last = this.#cur.children[this.#cur.children.length - 1];
      if (last instanceof dom.Text) {
        last.txt += txt;
      } else {
        this.#cur.add(new dom.Text(txt));
      }
    });
    this.#parser.on('comment', txt => {
      this.#cur.add(new dom.Comment(txt));
    });
    this.#parser.on('startCdataSection', () => {
      const cdata = new dom.CdataSection();
      this.#cur.add(cdata);
      this.#cur = cdata;
    });
    this.#parser.on('endCdataSection', () => {
      this.#cur = this.#cur.parent as dom.ParentNode;
    });
    this.#parser.on('xmlDecl', (version, en_coding, standalone) => {
      // XML Declaration not valid in external entities, silently ignore?
      if (this.#cur instanceof dom.Document) {
        this.#cur.add(new dom.XmlDeclaration(version, en_coding, standalone));
      }
    });
    this.#parser.on('processingInstruction', (target, data) => {
      this.#cur.add(new dom.ProcessingInstruction(target, data));
    });
    this.#parser.on('startDoctypeDecl', (doctypeName, sysid, pubid, hasInternalSubset) => {
      const decl = this.#parser?.opts.systemEntity ?
        new dom.DoctypeDecl( // Don't leave sysid in place if we're replacing
          doctypeName, undefined, undefined, hasInternalSubset
        ) :
        new dom.DoctypeDecl(
          doctypeName, sysid, pubid, hasInternalSubset
        );
      this.#cur.add(decl);
      this.#cur = decl;
    });
    this.#parser.on('endDoctypeDecl', () => {
      this._clearAttlist();
      this.#cur = this.#cur.parent as dom.ParentNode;
    });
    this.#parser.on('entityDecl', (
      entityName,
      isParameterEntity,
      value,
      base,
      systemId,
      publicId,
      notationName
    // eslint-disable-next-line @typescript-eslint/max-params
    ) => {
      this._clearAttlist();
      this.#cur.add(new dom.EntityDecl(
        entityName,
        isParameterEntity,
        value ?? undefined,
        base,
        systemId,
        publicId,
        notationName
      ));
    });
    this.#parser.on('notationDecl', (notationName, base, systemId, publicId) => {
      this._clearAttlist();
      this.#cur.add(
        new dom.NotationDecl(notationName, base, systemId, publicId)
      );
    });
    this.#parser.on('elementDecl', (name, model) => {
      this._clearAttlist();
      this.#cur.add(new dom.ElementDecl(name, model));
    });

    // eslint-disable-next-line @typescript-eslint/max-params
    this.#parser.on('attlistDecl', (elname, attname, attType, dflt, isrequired) => {
      if (this.#lastElName !== elname) {
        this._clearAttlist();
        const al = new dom.AttlistDecl(elname);
        this.#cur.add(al);
        this.#cur = al;
        this.#lastElName = elname;
      }
      this.#cur.add(new dom.AttributeDecl(attname, attType, dflt, isrequired));
    });
    this.#parser.on('default', txt => {
      if (this.#cur instanceof dom.ParentNode) {
        if (/^&[^ \t\r\n\f;]+;$/.test(txt)) {
          // I can't make this happen anymore.  Some combination of expanding
          // entity refs and loading system entities.
          this.#cur.add(new dom.EntityRef(txt));
        } else {
          // Expat doesn't normalize newlines in the default event.
          // XML 1.0r5 says: translate both the two-character sequence #xD #xA
          // and any #xD that is not followed by #xA to a single #xA character.
          this.#cur.add(new dom.Text(txt.replace(/\r\n?/g, '\n')));
        }
      }
    });
    this.#parser.on('skippedEntity', txt => {
      this.#cur.add(new dom.EntityRef(`&${txt};`));
    });
    this.#parser.on('error', e => {
      if (!this.#lastError) {
        this.#lastError = e as Error;
      }
    });
  }

  /**
   * Parse a full document.
   *
   * @param txt The text to parse.
   * @param opts Options.
   * @returns The created document.
   */
  public static parseFull(
    txt: string | Buffer | Uint8Array | Uint8ClampedArray,
    opts: ParserOptions
  ): dom.Document {
    const p = new DomParser(opts);
    // Useful for debug:
    // p.parser.on('*', console.log)
    try {
      return p.parse(txt, 1) as dom.Document;
    } finally {
      p.destroy();
    }
  }

  /**
   * Process a tagged template literal containing XML. Streams data into the
   * parser per-chunk.
   *
   * @param template Template pieces.
   * @param sub Substitutions.
   * @returns Parsed document, or undefined if not
   *   complete.
   * @throws XML parse error.
   */
  public static fromString(
    template: string[],
    ...sub: {toString(): string}[]
  ): Document | undefined {
    const p = new DomParser();
    let last = undefined;
    try {
      last = p.parse(template[0], sub.length > 0 ? 0 : 1);
      for (let i = 0; i < sub.length; i++) {
        p.parse(String(sub[i]), 0);
        last = p.parse(template[i + 1], (i === sub.length - 1) ? 1 : 0);
      }
      return last as Document | undefined;
    } finally {
      p.destroy();
    }
  }

  /**
   * Pop the stack.
   * @private
   */
  public _clearAttlist(): void {
    if (this.#cur instanceof dom.AttlistDecl) {
      this.#cur = this.#cur.parent as dom.ParentNode;
      this.#lastElName = null;
    }
  }

  /**
   * Parse a chunk of an XML document.  You can call this multiple times with
   * final=0, then with final=1 when you're done.
   *
   * @param str String to parse.
   * @param final If the last chunk of a document, 1.  Otherwise
   *   use 0.
   * @returns The parsed document, if successful and this was the final chunk.
   *   Otherwise undefined.
   * @throws Invalid state.
   */
  public parse(
    str: string | Buffer | Uint8Array | Uint8ClampedArray,
    final: number | boolean = 1
  ): dom.Document | undefined {
    if (!this.#parser) {
      throw new Error('Invalid state, parser destroyed');
    }

    try {
      const res = this.#parser.parse(str, Number(final));
      if (final && (res === 1)) {
        return this.#document;
      }
      return undefined;
    } catch (e) {
      const er = this.#lastError || e;
      this.#lastError = null;
      throw er;
    }
  }

  /**
   * Destroy this instance, cleaning up parser resources.
   */
  public destroy(): void {
    this.#parser?.destroy();
    this.#parser = null;
  }

  public [Symbol.dispose](): void {
    return this.destroy();
  }
}
