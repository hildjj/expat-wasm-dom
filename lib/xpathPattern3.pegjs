{
console.log('OPTIONS', options)

function extractList(list, index) {
  return list.map(e => e[index])
}

function buildList (head, tail, index) {
  return [head].concat(extractList(tail, index))
    .filter(e => e != null)
}

function reservedFnName (word) {
  switch (word) {
    case 'attribute':
    case 'comment':
    case 'document-node':
    case 'element':
    case 'empty-sequence':
    case 'if':
    case 'item':
    case 'namespace-node':
    case 'node':
    case 'processing-instruction':
    case 'schema-attribute':
    case 'schema-element':
    case 'text':
    case 'typeswitch':
      return true
  }
  return false
}
function slugify (s) {
  return s.split('-').map((p, i) => {
    if (i > 0) {
      return p[0].toUpperCase() + p.slice(1)
    }
    return p
  }).join('')
}
}

XPath
  = Expr

ParamList
  = head:Param tail:("," Param)*
  { return buildList(head, tail, 1) }

Param
  = "$" EQName TypeDeclaration?
FunctionBody
  = EnclosedExpr
EnclosedExpr
  = "{" Expr "}"
Expr
  = head:ExprSingle tail:("," ExprSingle)*
  { return tail.length ? ['_comma', buildList(head, tail, 1)] : head }

ExprSingle
  = ForExpr
  / LetExpr
  / QuantifiedExpr
  / IfExpr
  / OrExpr

ForExpr
  = SimpleForClause "return" ExprSingle

SimpleForClause
  = "for" SimpleForBinding ("," SimpleForBinding)*
SimpleForBinding
  = "$" VarName "in" ExprSingle
LetExpr
  = SimpleLetClause "return" ExprSingle
SimpleLetClause
  = "let" SimpleLetBinding ("," SimpleLetBinding)*
SimpleLetBinding
  = "$" VarName ":=" ExprSingle
QuantifiedExpr
  = ("some" / "every") "$" VarName "in" ExprSingle ("," "$" VarName "in" ExprSingle)* "satisfies" ExprSingle
IfExpr
  = "if" "(" Expr ")" "then" ExprSingle "else" ExprSingle
OrExpr
  = head:AndExpr tail:( "or" AndExpr )*
  { return tail.length ? ['_or', buildList(head, tail, 1)] : head }

AndExpr
  = head:ComparisonExpr tail:( "and" ComparisonExpr )*
  { return tail.length ? ['_and', buildList(head, tail, 1)] : head }

ComparisonExpr
  = head:StringConcatExpr tail:( _ (ValueComp
  / GeneralComp
  / NodeComp) _ StringConcatExpr )?
  { return tail ? ['_compare', head, tail[1], tail[3]] : head }

StringConcatExpr
  = head:RangeExpr tail:( "||" RangeExpr )*
  { return tail.length ? ['_concat', buildList(head, tail, 1)] : head }

RangeExpr
  = head:AdditiveExpr to:( $"to" AdditiveExpr )?
  { return to ? ['_range', head, to[1]] : head }

AdditiveExpr
  = head:MultiplicativeExpr tail:( $("+" / "-") MultiplicativeExpr )*
  { return tail.length ? ['_add', head, tail] : head }

MultiplicativeExpr
  = head:UnionExpr tail:( $("*" / "div" / "idiv" / "mod") UnionExpr )*
  { return tail.length ? ['_multiply', head, tail] : head }

UnionExpr
  = head:IntersectExceptExpr tail:( ("union" / "|") IntersectExceptExpr )*
  { return tail.length ? ['_union', buildList(head, tail, 1)] : head }

IntersectExceptExpr
  = head:InstanceofExpr tail:( ("intersect" / "except") InstanceofExpr )*
  { return tail.length ? ['_intersect', buildList(head, tail, 1)] : head }

InstanceofExpr
  = e:TreatExpr t:( "instance" "of" SequenceType )?
  { return t ? ['_instanceOf', e, t] : e }

TreatExpr
  = e:CastableExpr t:( "treat" "as" SequenceType )?
  { return t ? ['_treatAs', e, t] : e }

CastableExpr
  = e:CastExpr t:( "castable" "as" SingleType )?
  { return t ? ['_castableAs', e, t] : e }

CastExpr
  = e:UnaryExpr t:( "cast" "as" SingleType )?
  { return t ? ['_castAs', e, t] : e }

UnaryExpr
  = s:$("-" / "+")* e:ValueExpr
  { return s.length ? ['_unary', s, e] : e }

ValueExpr
  = SimpleMapExpr

GeneralComp
  = $"="
  / $"!="
  / $"<"
  / $"<="
  / $">"
  / $">="

ValueComp
  = $"eq"
  / $"ne"
  / $"lt"
  / $"le"
  / $"gt"
  / $"ge"

NodeComp
  = $"is"
  / $"<<"
  / $">>"

SimpleMapExpr
  = head:PathExpr tail:("!" PathExpr)*
  { return tail.length ? ['_simpleMap', buildList(head, tail, 1)] : head }

PathExpr
  = r:("//" RelativePathExpr) { return ['_all', r[1]] }
  / r:("/" RelativePathExpr?) { return r[1] ? ['_root', r[1]] : ['_root'] }
  / RelativePathExpr

RelativePathExpr
  = head:StepExpr tail:(Slash StepExpr)*
  { return tail.length ? ['_relative', head, tail.map(([s, e]) => ['_step', s, e])] : head }

Slash
  = $"//"
  / $"/"

StepExpr
  = PostfixExpr
  / AxisStep

AxisStep
  = step:(ReverseStep / ForwardStep) predicates:PredicateList
  { return predicates.length ? ['_filter', step, predicates] : step }

ForwardStep
  = (ForwardAxis NodeTest)
  / AbbrevForwardStep

ForwardAxis
  = a:(("child" "::")
  / ("descendant" "::")
  / ("attribute" "::")
  / ("self" "::")
  / ("descendant-or-self" "::")
  / ("following-sibling" "::")
  / ("following" "::")
  / ("namespace" "::"))
  { return '_' + slugify(a[0]) }

AbbrevForwardStep
  = a:"@"? t:NodeTest
  { return a ? ['_attrib', t] : t }

ReverseStep
  = (ReverseAxis NodeTest)
  / AbbrevReverseStep

ReverseAxis
  = a:(("parent" "::")
  / ("ancestor" "::")
  / ("preceding-sibling" "::")
  / ("preceding" "::")
  / ("ancestor-or-self" "::"))
  { return '_' + slugify(a[0]) }

AbbrevReverseStep
  = ".."
  { return ['_parent'] }

NodeTest
  = KindTest
  / NameTest

NameTest
  = q:EQName { return ['_nameTest', q]}
  / w:Wildcard { return ['_nameTestWildcard', w] }

Wildcard
  = "*"
  / $(NCName ":" "*")
  / $("*" ":" NCName)
  / (BracedURILiteral "*")

PostfixExpr
  = head:PrimaryExpr tail:(Predicate / ArgumentList)*
  { return tail.length ? ['_postfix', head, tail] : head }

ArgumentList
  = "(" (Argument ("," Argument)*)? ")"
PredicateList
  = Predicate*
Predicate
  = "[" e:Expr "]"
  { return ['_pred', e] }

PrimaryExpr
  = VarRef
  / ContextItemExpr
  / FunctionCall
  / FunctionItemExpr
  / ParenthesizedExpr
  / Literal

Literal
  = NumericLiteral
  / StringLiteral

NumericLiteral
  = IntegerLiteral
  / DecimalLiteral
  / DoubleLiteral

VarRef
  = "$" VarName
VarName
  = EQName
ParenthesizedExpr
  = "(" Expr? ")"
ContextItemExpr
  = "."
  { return ['_dot'] }

FunctionCall
  = fn:EQName ! {return reservedFnName(fn)} params:ArgumentList
  { return ['_fn', fn, params] }

Argument
  = ExprSingle / ArgumentPlaceholder
ArgumentPlaceholder
  = "?"
FunctionItemExpr
  = NamedFunctionRef / InlineFunctionExpr
NamedFunctionRef
  = EQName "#" IntegerLiteral 	/* xgc: reserved-function-names */
InlineFunctionExpr
  = "function" "(" ParamList? ")" ("as" SequenceType)? FunctionBody
SingleType
  = SimpleTypeName "?"?
TypeDeclaration
  = "as" SequenceType
SequenceType
  = ("empty-sequence" "(" ")")
  / (ItemType OccurrenceIndicator?)
OccurrenceIndicator
  = "?" / "*" / "+" 	/* xgc: occurrence-indicators */
ItemType
  = KindTest / ("item" "(" ")") / FunctionTest / AtomicOrUnionType / ParenthesizedItemType
AtomicOrUnionType
  = EQName
KindTest
  = DocumentTest
  / ElementTest
  / AttributeTest
  / SchemaElementTest
  / SchemaAttributeTest
  / PITest
  / CommentTest
  / TextTest
  / NamespaceNodeTest
  / AnyKindTest
AnyKindTest
  = "node" "(" _ ")"
  { return [ '_anyKindTest' ] }

DocumentTest
  = "document-node" "(" _ t:(ElementTest / SchemaElementTest)? _ ")"
  { return ['_documentTest', t ]}

TextTest
  = "text" "(" _ ")"
  { return [ '_textTest' ] }

CommentTest
  = "comment" "(" ")"
NamespaceNodeTest
  = "namespace-node" "(" ")"
PITest
  = "processing-instruction" "(" (NCName / StringLiteral)? ")"
AttributeTest
  = "attribute" "(" (AttribNameOrWildcard ("," TypeName)?)? ")"
AttribNameOrWildcard
  = AttributeName / "*"
SchemaAttributeTest
  = "schema-attribute" "(" AttributeDeclaration ")"
AttributeDeclaration
  = AttributeName
ElementTest
  = "element" "(" (ElementNameOrWildcard ("," TypeName "?"?)?)? ")"
ElementNameOrWildcard
  = ElementName / "*"
SchemaElementTest
  = "schema-element" "(" ElementDeclaration ")"
ElementDeclaration
  = ElementName
AttributeName
  = EQName
ElementName
  = EQName
SimpleTypeName
  = TypeName
TypeName
  = EQName
FunctionTest
  = AnyFunctionTest
  / TypedFunctionTest
AnyFunctionTest
  = "function" "(" "*" ")"
TypedFunctionTest
  = "function" "(" (SequenceType ("," SequenceType)*)? ")" "as" SequenceType
ParenthesizedItemType
  = "(" ItemType ")"
EQName
  = QName / URIQualifiedName

Comment /* TODO: Nesting */
  = "(:" CommentContents ":)" /* no-op */

QName
  = PrefixedName
  / UnprefixedName

PrefixedName
  = prefix:Prefix ':' local:LocalPart { return { prefix, local } }

UnprefixedName
  = LocalPart

Prefix
  = NCName

LocalPart
  = NCName

NCName
  = $(NCNameStartChar NCNameChar*)

NCNameStartChar
  = [A-Z]
  / "_"
  / [a-z]
  / [\u00C0-\u00D6]
  / [\u00D8-\u00F6]
  / [\u00F8-\u02FF]
  / [\u0370-\u037D]
  / [\u037F-\u1FFF]
  / [\u200C-\u200D]
  / [\u2070-\u218F]
  / [\u2C00-\u2FEF]
  / [\u3001-\uD7FF]
  / [\uF900-\uFDCF]
  / [\uFDF0-\uFFFD]
/*  / [\u{10000}-\u{EFFFF}] */

NCNameChar
  = NCNameStartChar
  / "-"
  / "."
  / [0-9]
  / "\u00B7"
  / [\u0300-\u036F]
  / [\u203F-\u2040]

NameStartChar
  = ":"
  / [A-Z]
  / "_"
  / [a-z]
  / [\u00C0-\u00D6]
  / [\u00D8-\u00F6]
  / [\u00F8-\u02FF]
  / [\u0370-\u037D]
  / [\u037F-\u1FFF]
  / [\u200C-\u200D]
  / [\u2070-\u218F]
  / [\u2C00-\u2FEF]
  / [\u3001-\uD7FF]
  / [\uF900-\uFDCF]
  / [\uFDF0-\uFFFD]
/*  / [\u{10000}-\u{EFFFF}] */

NameChar
  = NameStartChar
  / "-"
  / "."
  / [0-9]
  / "\u00B7"
  / [\u0300-\u036F]
  / [\u203F-\u2040]

Name
  = $(NameStartChar NameChar*)

Digits
  = $[0-9]+

CommentContents
  = $(CommentChar*)

CommentChar
  = ":" ! ")"
  / [^:]

Char
  = "\t"
  / "\n"
  / "\r"
  / [\u0020-\uD7FF]
  / [\uE000-\uFFFD]
/*  / [\u10000-\u10FFFF] */

_
  = $[ \t\n\r]* { return undefined }

IntegerLiteral
  = d:Digits
  { return parseInt(d, 10) }

DecimalLiteral
  = d:$(("." Digits)
  / (Digits "." [0-9]*))
  { return parseFloat(d) }

DoubleLiteral
  = d:$((("." Digits) / (Digits ("." [0-9]*)?)) [eE] [+-]? Digits)
  { return parseFloat(d) }

StringLiteral
  = s:('"' $(EscapeQuot / [^"])* '"') { return s[1] }
  / s:("'" $(EscapeApos / [^'])* "'") { return s[1] }

URIQualifiedName
  = BracedURILiteral NCName 	/* ws: explicit */
BracedURILiteral
  = "Q" "{" uri:([^{}]*) "}"
  { return ['_bracedURI', uri] }

EscapeQuot
  = $'""'
EscapeApos
  = $"''"
