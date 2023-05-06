import * as dom from './dom.js'
import {NS} from './ns.js'
import {XmlParser} from 'expat-wasm'

/**
 * Encodings that expat supports.
 *
 * @typedef { undefined|null|"US-ASCII"|"UTF-8"|"UTF-16"|"ISO-8859-1"
 * } XML_Encoding
 */

/**
 * @typedef {object} EntityInfo
 * @prop {string} base
 * @prop {string|Buffer|Uint8Array|Uint8ClampedArray} data
 */

/**
 * @callback ReadEntity
 * @param {string} base
 * @param {string} systemId
 * @param {string} [publicId]
 * @returns {EntityInfo}
 */

/**
 * @typedef {object} ParserOptions
 * @prop {XML_Encoding} [encoding] null will do content
 *   sniffing.
 * @prop {string|XmlParser.NO_NAMESPACES} [separator='|'] the separator
 *   for namespace URI and element/attribute name.  Use
 *   XmlParser.NO_NAMESPACES to get Expat's old, broken namespace
 *   non-implementation via XmlParserCreate instead of XmlParserCreateNS.
 * @prop {boolean} [expandInternalEntities] expand internal entities
 * @prop {ReadEntity|null} [systemEntity] expand external entities using this
 *   callback
 * @prop {string|null} [base] Base URI for inclusions
 * @prop {boolean} xmlBase Add xml:base attributes when parsing external
 *   entitites.
 */

/**
 * Parse XML text to a Document Object Model.
 *
 * You should call .destroy() when done, or you will leak memory from
 * the parser WASM instance.
 */
export class DomParser {
  #document = new dom.Document()

  /** @type {string?} */
  #lastElName = null

  /** @type {Error?} */
  #lastError = null

  /** @type {string[][]} */
  #pendingNS = []

  /** @type {dom.ParentNode} */
  #cur = this.#document

  /** @type {XmlParser=} */
  #parser = undefined

  /** @type {string[]} */
  #base = []

  /** @type {dom.ParentNode[]} */
  #baseParent = []

  /**
   * Create a DOM Parser.
   *
   * @param {ParserOptions} [options]
   *   Encoding to expect from Buffers/etc that are passed to parse()
   */
  constructor(options) {
    // Separator is always '|'.  We're always going to take care of namespace
    // triples before the user sees them.
    this.#parser = new XmlParser(options)

    if (options?.xmlBase) {
      if (!options?.base) {
        throw new Error('Must specify "base" option to turn on xmlBase')
      }
      this.#base.push(options.base)
      this.#baseParent.push(this.#document)
      this.#parser.on('startBase', base => {
        this.#base.push(base)
        this.#baseParent.push(this.#cur)
      })
      this.#parser.on('endBase', base => {
        const old = this.#base.pop()
        if (old !== base) {
          this.#lastError = new Error(`Invalid base "${base}" != "${old}"`)
          this.#parser?.stop()
        }
        this.#baseParent.pop()
      })
    }

    this.#parser.on('startNamespaceDecl', (prefix, uri) => {
      this.#pendingNS.push([prefix, uri])
    })
    this.#parser.on('startElement', (nm, at) => {
      const el = new dom.Element(
        // @ts-ignore
        this.#parser.triple(nm),
        // @ts-ignore
        Object.entries(at).map(([k, v]) => [this.#parser.triple(k), v]),
        this.#pendingNS
      )
      this.#pendingNS = []

      if (
        options?.xmlBase &&
        (this.#baseParent.length > 0) &&
        (this.#cur === this.#baseParent[this.#baseParent.length - 1])
      ) {
        el.setAttribute({
          prefix: 'xml',
          local: 'base',
          ns: NS.XML,
        }, this.#base[this.#base.length - 1])
      }
      this.#cur.add(el)
      this.#cur = el
    })
    this.#parser.on('endElement', () => {
      this.#cur = /** @type {dom.ParentNode} */ (this.#cur.parent)
    })
    this.#parser.on('characterData', txt => {
      const last = this.#cur.children[this.#cur.children.length - 1]
      if (last instanceof dom.Text) {
        last.txt += txt
      } else {
        this.#cur.add(new dom.Text(txt))
      }
    })
    this.#parser.on('comment', txt => {
      this.#cur.add(new dom.Comment(txt))
    })
    this.#parser.on('startCdataSection', () => {
      const cdata = new dom.CdataSection()
      this.#cur.add(cdata)
      this.#cur = cdata
    })
    this.#parser.on('endCdataSection', () => {
      this.#cur = /** @type {dom.ParentNode} */ (this.#cur.parent)
    })
    this.#parser.on('xmlDecl', (version, en_coding, standalone) => {
      // XML Declaration not valid in external entities, silently ignore?
      if (this.#cur instanceof dom.Document) {
        this.#cur.add(new dom.XmlDeclaration(version, en_coding, standalone))
      }
    })
    this.#parser.on('processingInstruction', (target, data) => {
      this.#cur.add(new dom.ProcessingInstruction(target, data))
    })
    this.#parser.on('startDoctypeDecl', (doctypeName, sysid, pubid, hasInternalSubset) => {
      const decl = this.#parser?.opts.systemEntity ?
        new dom.DoctypeDecl( // Don't leave sysid in place if we're replacing
          doctypeName, undefined, undefined, hasInternalSubset
        ) :
        new dom.DoctypeDecl(
          doctypeName, sysid, pubid, hasInternalSubset
        )
      this.#cur.add(decl)
      this.#cur = decl
    })
    this.#parser.on('endDoctypeDecl', () => {
      this._clearAttlist()
      this.#cur = /** @type {dom.ParentNode} */ (this.#cur.parent)
    })
    this.#parser.on('entityDecl', (
      entityName,
      isParameterEntity,
      value,
      base,
      systemId,
      publicId,
      notationName
    // eslint-disable-next-line max-params
    ) => {
      this._clearAttlist()
      this.#cur.add(new dom.EntityDecl(
        entityName,
        isParameterEntity,
        value,
        base,
        systemId,
        publicId,
        notationName
      ))
    })
    this.#parser.on('notationDecl', (notationName, base, systemId, publicId) => {
      this._clearAttlist()
      this.#cur.add(
        new dom.NotationDecl(notationName, base, systemId, publicId)
      )
    })
    this.#parser.on('elementDecl', (name, model) => {
      this._clearAttlist()
      this.#cur.add(new dom.ElementDecl(name, model))
    })

    // eslint-disable-next-line max-params
    this.#parser.on('attlistDecl', (elname, attname, attType, dflt, isrequired) => {
      if (this.#lastElName !== elname) {
        this._clearAttlist()
        const al = new dom.AttlistDecl(elname)
        this.#cur.add(al)
        this.#cur = al
        this.#lastElName = elname
      }
      this.#cur.add(new dom.AttributeDecl(attname, attType, dflt, isrequired))
    })
    this.#parser.on('default', txt => {
      if (this.#cur instanceof dom.ParentNode) {
        if (/^&[^ \t;]+;$/.test(txt)) {
          this.#cur.add(new dom.EntityRef(txt))
        } else {
          this.#cur.add(new dom.Text(txt))
        }
      }
    })
    this.#parser.on('skippedEntity', txt => {
      this.#cur.add(new dom.EntityRef(`&${txt};`))
    })
    this.#parser.on('error', e => {
      if (!this.#lastError) {
        this.#lastError = e
      }
    })
  }

  /**
   * Parse a full document.
   *
   * @param {string|Buffer|Uint8Array|Uint8ClampedArray} txt The text to parse.
   * @param {ParserOptions} opts
   * @returns {dom.Document} The created document.
   */
  static parseFull(txt, opts) {
    const p = new DomParser(opts)
    // Useful for debug:
    // p.parser.on('*', console.log)
    try {
      return /** @type {dom.Document} */ (p.parse(txt, 1))
    } finally {
      p.destroy()
    }
  }

  /**
   * Process a tagged template literal containing XML.
   * Streams data into the parser per-chunk.
   *
   * @param {string[]} template Template pieces
   * @param {...string} sub Substitutions
   */
  static fromString(template, ...sub) {
    const p = new DomParser()
    let last = null
    try {
      last = p.parse(template[0], sub.length > 0 ? 0 : 1)
      for (let i = 0; i < sub.length; i++) {
        p.parse(sub[i].toString(), 0)
        last = p.parse(template[i + 1], (i === sub.length - 1) ? 1 : 0)
      }
      return last
    } finally {
      p.destroy()
    }
  }

  /**
   * Pop the stack.
   * @private
   */
  _clearAttlist() {
    if (this.#cur instanceof dom.AttlistDecl) {
      this.#cur = /** @type {dom.ParentNode} */ (this.#cur.parent)
      this.#lastElName = null
    }
  }

  /**
   * Parse a chunk of an XML document.  You can call this multiple times with
   * final=0, then with final=1 when you're done.
   *
   * @param {string|Buffer|Uint8Array|Uint8ClampedArray} str
   * @param {number} [final=1] If the last chunk of a document, 1.  Otherwise
   *   use 0.
   * @returns {dom.Document=} The parsed document, if successful and this was
   *   the final chunk.  Otherwise 0.
   */
  parse(str, final = 1) {
    if (!this.#parser) {
      throw new Error('Invalid state, parser destroyed')
    }

    try {
      const res = this.#parser.parse(str, final)
      if ((final === 1) && (res === 1)) {
        return this.#document
      }
      return undefined
    } catch (e) {
      const er = this.#lastError || e
      this.#lastError = null
      throw er
    }
  }

  /**
   * Destroy this instance, cleaning up parser resources.
   */
  destroy() {
    this.#parser?.destroy()
    this.#parser = undefined
  }
}
