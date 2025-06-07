/* eslint-disable jsdoc/imports-as-dependencies */
import {Option} from 'commander';
import {Resolver} from './entity.js';

/**
 * Add a few common options onto an existing commnd, and parse input.
 *
 * @template {import('commander').Command} T
 * @param {T} program Program to augment.
 * @param {string[]} [args] Command line arguments.
 * @returns {T} Augmented command.
 */
export function sharedOptions(program, args) {
  program
    .option('-b, --base', 'Apply xml:base attributes to entities from included files')
    .option('-e,--expand <root>', 'Expand external entities, but only within the specified root directory')
    .addOption(
      new Option('-E', 'Expand external entities, but only within the current working directory')
        .conflicts('expand')
    )
    .addOption(
      new Option('--encoding <enc>', 'Encoding to assume for the input files')
        .choices(['US-ASCII', 'UTF-8', 'UTF-16', 'ISO-8859-1'])
        .default(null, 'Sniff encoding heuristically')
    )
    .option('-r,--refs', 'Keep entity references, rather than expanding them')
    .parse(args);

  // .argument() adds to _args
  if (program.args.length < program._args.length) {
    program.args.push('-');
  }

  const opts = program.opts();
  if (opts.E) {
    opts.expand = process.cwd();
  }
  opts.systemEntity = opts.expand ?
    new Resolver(opts.expand).systemEntity :
    undefined;

  return program;
}
