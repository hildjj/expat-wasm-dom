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
      resolve(doc)
    })
    inStream.on('error', reject)
  })
}

async function main() {
  const args = process.argv.slice(2)
  switch (args.length) {
    case 0:
      console.error('Usage: ewq <xpath> [file...]')
      process.exit(64)
      break
    case 1:
      args.push('-')
      break
    default:
      break
  }
  const xp = args.shift()
  for (const arg of args) {
    const s = (arg === '-') ? process.stdin : fs.createReadStream(arg)
    const doc = await parse(s)
    const res = doc.get(xp)
    for (const r of res) {
      console.log(r.toString({colors: process.stdout.isTTY, depth: Infinity}))
    }
  }
}

main().catch(e => {
  console.log(e)
  process.exit(1)
})
