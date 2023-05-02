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

Docs coming soon.

