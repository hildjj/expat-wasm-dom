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