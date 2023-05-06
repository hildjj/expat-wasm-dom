#!/usr/bin/env node

/* eslint-disable no-console */
import {Command} from 'commander'
import {parse} from '../lib/entity.js'
import {sharedOptions} from '../lib/shared.js'

const program = sharedOptions(
  new Command()
    .argument('[file...]', 'Files to parse, use "-" for stdin', '-')
    .description('Parse each input file.  If successful, print the contents of the file as reconstructed from the DOM.')
)

const opts = program.opts()

async function main() {
  for (const arg of program.args) {
    const doc = await parse(arg, opts)
    process.stdout.write(
      doc.toString({colors: process.stdout.isTTY, depth: Infinity})
    )
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
