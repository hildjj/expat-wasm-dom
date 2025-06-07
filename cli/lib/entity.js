import {fileURLToPath, pathToFileURL} from 'node:url';
import {DomParser} from 'expat-wasm-dom';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Load an external reference from the file system synchronously.
 * Ensure all references within a root directory, in an attempt to mitigate
 * unwanted disk access.
 */
export class Resolver {
  #root = '';

  constructor(root) {
    if (typeof root !== 'string') {
      throw new TypeError(`Invalid root: "${root}"`);
    }

    if (root.startsWith('file:')) {
      // Triple-check that we've got a fully-resolved path.
      // Deals with . and .. at least.
      this.#root = Resolver.resolveFile(fileURLToPath(root));
    } else {
      // Non-file: URL scheme, and not Windows file name.
      if (/^[a-z]{2,}:/i.test(root)) {
        throw new TypeError(`Unsupported URL scheme: "${root}"`);
      }
      this.#root = Resolver.resolveFile(root);
    }
    this.systemEntity = this.systemEntity.bind(this);
  }

  /**
   * Turn a path into a file: URL string, after resolving ., .., etc.
   *
   * @param {string} name File name.
   * @returns {string} Resolved file name.
   */
  static resolveFile(name) {
    return pathToFileURL(path.resolve(name)).toString();
  }

  systemEntity(base, sysId) {
    const newBase = new URL(sysId, base);
    const bs = newBase.toString();
    if (!bs.startsWith(this.#root)) {
      throw new Error(`Trying to read outside root: "${bs}" not in "${this.#root}"`);
    }
    return {
      base: bs,
      data: fs.readFileSync(newBase),
    };
  }
}

/**
 * Parse a file by name.
 *
 * @param {string} fileName File name.
 * @param {object} opts Options.
 * @returns {import('../lib/dom.js').Document} Parsed document.
 */
export function parse(fileName, opts) {
  let inStream = process.stdin;
  if (fileName === '-') {
    fileName = new URL('-stdin-.xml', Resolver.resolveFile(process.cwd())).toString();
  } else {
    inStream = fs.createReadStream(fileName);
    fileName = Resolver.resolveFile(fileName);
  }

  const p = new DomParser({
    expandInternalEntities: !opts.refs,
    base: fileName,
    xmlBase: opts.base,
    systemEntity: opts.systemEntity,
  });
  return new Promise((resolve, reject) => {
    inStream.on('data', b => {
      try {
        p.parse(b, 0);
      } catch (e) {
        e.fileName = fileName;
        reject(e);
      }
    });
    inStream.on('end', () => {
      try {
        const doc = p.parse(new Uint8Array(0), 1);
        resolve(doc);
      } catch (e) {
        reject(e);
      }
    });
    inStream.on('error', reject);
  });
}
