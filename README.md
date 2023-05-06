A simple DOM for [expat-wasm](https://github.com/hildjj/expat-wasm).

To install:

```sh
npm install --save expat-wasm-dom
```

To use:

```js
import DomParser from 'expat-wasm-dom'
const doc = DomParser.parse('<foo/>')
console.log(doc.root.toString())
```

Full [documentation](https://hildjj.github.io/expat-wasm-dom/) is available.

--
[![Tests](https://github.com/hildjj/expat-wasm-dom/actions/workflows/node.js.yml/badge.svg)](https://github.com/hildjj/expat-wasm-dom/actions/workflows/node.js.yml)
