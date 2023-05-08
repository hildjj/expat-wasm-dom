# expat-wasm-dom-cli

Command line utilities for [expat-wasm-dom](https://github.com/hildjj/expat-wasm-dom).

## Installation

```sh
npm install -g expat-wasm-dom-cli
```

## ewlint

```txt
Usage: ewlint [options] [file...]

Parse each input file.  If successful, print the contents of the file as
reconstructed from the DOM.

Arguments:
  file                Files to parse, use "-" for stdin (default: "-")

Options:
  -b, --base          Apply xml:base attributes to entities from included files
  -e,--expand <root>  Expand external entities, but only within the specified
                      root directory
  -E                  Expand external entities, but only within the current
                      working directory
  --encoding <enc>    Encoding to assume for the input files (choices:
                      "US-ASCII", "UTF-8", "UTF-16", "ISO-8859-1", default:
                      Sniff encoding heuristically)
  -r,--refs           Keep entity references, rather than expanding them
  -h, --help          display help for command
```

## ewq

```txt
Usage: ewq [options] <xpath> [files...]

Parse each input file, then apply the given xpath to the generated documents.

Arguments:
  xpath
  files               Files to parse, use "-" for stdin (default: "-")

Options:
  -b, --base          Apply xml:base attributes to entities from included files
  -e,--expand <root>  Expand external entities, but only within the specified
                      root directory
  -E                  Expand external entities, but only within the current
                      working directory
  --encoding <enc>    Encoding to assume for the input files (choices:
                      "US-ASCII", "UTF-8", "UTF-16", "ISO-8859-1", default:
                      Sniff encoding heuristically)
  -r,--refs           Keep entity references, rather than expanding them
  -h, --help          display help for command
```
