start
  = r:root? c:children? { return r ? [r, ...(c || [])] : c }

root
  = "/" { return ['_doc'] }

children
  = f:first o:op* { return [f, ...o] }

first
  = segment

op
  = child
  / filter

child
  = "/" seg:segment { return seg }

segment
  = text
  / attrib
  / element

element
  = n:name { return ['_childElem', n] }

filter
  = matchNum
  / realFilter

matchNum
  = "[" d:DIGITS "]" { return ['_matchNumber', d] }

realFilter
  = "[" s:segment v:value? "]" { return ['_filter', s, v] }

value
  = "=" q:qvalue { return q }

qvalue
  = dqvalue
  / sqvalue

dqvalue
  = QUOT v:$[^"]* QUOT { return v }

sqvalue
  = SQUOT v:$[^']* SQUOT { return v }

text
  = "text()" { return ['_text'] }

attrib
  = "@" n:name { return ['_attrib', n] }

name
  = $ [A-Za-z0-9_]+

DIGITS
  = d:$[0-9]+ { return parseInt(d, 10) }

QUOT
  = "\""

SQUOT
  = "'"