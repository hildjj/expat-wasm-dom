#!/usr/bin/env node

/* eslint-disable no-console */
import DomParser from '../lib/index.js'
import fs from 'fs'

function parse(inStream) {
  const p = new DomParser()
  return new Promise((resolve, reject) => {
    inStream.on('data', b => p.parse(b, 0))
    inStream.on('end', () => {
      const doc = p.parse(new Uint8Array(0), 1)
      console.log(
        doc.toString({colors: process.stdout.isTTY, depth: Infinity})
      )
      resolve(doc)
    })
    inStream.on('error', reject)
  })
}

async function main() {
  let args = process.argv.slice(2)
  if (args.length === 0) {
    args = ['-']
  }
  for (const arg of args) {
    const s = (arg === '-') ? process.stdin : fs.createReadStream(arg)
    await parse(s)
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
