#!/usr/bin/env node

/* eslint-disable no-console */
import DomParser from '../lib/index.js'
import fs from 'fs'

function parse(inStream, fileName) {
  const p = new DomParser()
  return new Promise((resolve, reject) => {
    inStream.on('data', b => {
      try {
        p.parse(b, 0)
      } catch (e) {
        e.fileName = fileName
        reject(e)
      }
    })
    inStream.on('end', () => {
      try {
        const doc = p.parse(new Uint8Array(0), 1)
        console.log(
          doc.toString({colors: process.stdout.isTTY, depth: Infinity})
        )
        resolve(doc)
      } catch (e) {
        e.fileName = fileName
        reject(e)
      }
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
    await parse(s, arg)
  }
}

main().catch(e => {
  console.log()
  console.error(e)
  process.exit(1)
})
