#!/usr/bin/env node

/* eslint-disable no-console */
import {Command} from 'commander';
import {dom} from 'expat-wasm-dom';
import {parse} from '../lib/entity.js';
import {sharedOptions} from '../lib/shared.js';

const program = sharedOptions(
  new Command()
    .argument('<xpath>')
    .argument('[files...]', 'Files to parse, use "-" for stdin', '-')
    .description('Parse each input file, then apply the given xpath to the generated documents.')
);

const opts = program.opts();

async function main() {
  const xpath = program.args.shift();

  for (const arg of program.args) {
    const doc = await parse(arg, opts);
    const res = doc.get(xpath);
    for (const r of res) {
      if (r instanceof dom.Node) {
        console.log(r.toString({
          colors: process.stdout.isTTY,
          depth: Infinity,
        }));
      } else {
        console.log(r);
      }
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
