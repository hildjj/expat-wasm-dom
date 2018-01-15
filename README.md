A simple DOM for [expat-wasm](https://github.com/hildjj/expat-wasm).

To install:

    npm install --save expat-wasm-dom

To use:

    const {DomParser} = require('expat-wasm-dom')
    async function f () {
      let doc = await DomParser.parse('<foo/>')
      console.log(doc.root.toString())
    }
    f()

Docs coming soon.

[![Build Status](https://travis-ci.org/hildjj/expat-wasm-dom.svg?branch=master)](https://travis-ci.org/hildjj/expat-wasm-dom)
[![Coverage Status](https://coveralls.io/repos/github/hildjj/expat-wasm-dom/badge.svg?branch=master)](https://coveralls.io/github/hildjj/expat-wasm-dom?branch=master)