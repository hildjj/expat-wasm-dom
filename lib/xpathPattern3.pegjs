{{
// @ts-nocheck
import util from 'util'

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
}}
{
function bind(op, ...args) {
  let f = options.impl[op]
  let name = op
  if (!f) {
    f = options.impl._unimplemented
    args.unshift(op)
    name = '_unimplemented'
  }
  f = f.bind(options.impl)
  f[util.inspect.custom] = (depth, options) => options.stylize(name, 'null') + '()'
  return [f, ...args]
}
}

XPath
  = Expr

ParamList
  = Param|1.., ","|

Param
  = "$" EQName TypeDeclaration?

FunctionBody
  = EnclosedExpr

EnclosedExpr
  = "{" Expr "}"

Expr "Expression"
  = head:ExprSingle tail:("," @ExprSingle)*
  { return tail.length ? bind('_comma', [head, ...tail]) : head }

ExprSingle
  = ForExpr
  / LetExpr
  / QuantifiedExpr
  / IfExpr
  / OrExpr

ForExpr
  = SimpleForClause "return" ExprSingle

SimpleForClause
  = "for" SimpleForBinding|1.., ","|

SimpleForBinding
  = "$" VarName "in" ExprSingle

LetExpr
  = SimpleLetClause "return" ExprSingle

SimpleLetClause
  = "let" SimpleLetBinding|1.., ","|

SimpleLetBinding
  = "$" VarName ":=" ExprSingle

QuantifiedExpr
  = ("some" / "every") "$" VarName "in" ExprSingle ("," "$" VarName "in" ExprSingle)* "satisfies" ExprSingle

IfExpr
  = "if" "(" Expr ")" "then" ExprSingle "else" ExprSingle

OrExpr
  = head:AndExpr tail:( "or" @AndExpr )*
  { return tail.length ? bind('_or', [head, ...tail]) : head }

AndExpr
  = head:ComparisonExpr tail:( "and" @ComparisonExpr )*
  { return tail.length ? bind('_and', [head, ...tail]) : head }

ComparisonExpr
  = head:StringConcatExpr tail:( _ @AnyComp _ @StringConcatExpr )?
  { return tail ? bind('_compare', head, tail[0], tail[1]) : head }

AnyComp
  = ValueComp
  / GeneralComp
  / NodeComp

StringConcatExpr
  = head:RangeExpr tail:( "||" @RangeExpr )*
  { return tail.length ? bind('_concat', [head, ...tail]) : head }

RangeExpr
  = head:AdditiveExpr to:( "to" @AdditiveExpr )?
  { return to ? bind('_range', head, to) : head }

AdditiveExpr
  = head:MultiplicativeExpr tail:( $("+" / "-") MultiplicativeExpr )*
  { return tail.length ? bind('_add', head, tail) : head }

MultiplicativeExpr
  = head:UnionExpr tail:( $("*" / "div" / "idiv" / "mod") UnionExpr )*
  { return tail.length ? bind('_multiply', head, tail) : head }

UnionExpr
  = head:IntersectExceptExpr tail:( ("union" / "|") @IntersectExceptExpr )*
  { return tail.length ? bind('_union', [head, ...tail]) : head }

IntersectExceptExpr
  = head:InstanceofExpr tail:( ("intersect" / "except") _ @InstanceofExpr )*
  { return tail.length ? bind('_intersect', [head, ...tail]) : head }

InstanceofExpr
  = e:TreatExpr t:( _ "instance" _ "of" _ @SequenceType )?
  { return t ? bind('_instanceOf', e, t) : e }

TreatExpr
  = e:CastableExpr t:( _ "treat" _ "as" _ @SequenceType )?
  { return t ? bind('_treatAs', e, t) : e }

CastableExpr
  = e:CastExpr t:( _ "castable" _ "as" _ @SingleType )?
  { return t ? bind('_castableAs', e, t) : e }

CastExpr
  = e:UnaryExpr t:( "cast" "as" SingleType )?
  { return t ? bind('_castAs', e, t) : e }

UnaryExpr
  = s:$("-" / "+")* e:ValueExpr
  { return s.length ? bind('_unary', s, e) : e }

ValueExpr
  = SimpleMapExpr

GeneralComp
  = "="
  / "!="
  / "<"
  / "<="
  / ">"
  / ">="

ValueComp
  = "eq"
  / "ne"
  / "lt"
  / "le"
  / "gt"
  / "ge"

NodeComp
  = "is"
  / "<<"
  / ">>"

SimpleMapExpr
  = head:PathExpr tail:("!" @PathExpr)*
  { return tail.length ? bind('_simpleMap', [head, ...tail]) : head }

PathExpr
  = r:("//" @RelativePathExpr) { return bind('_all', r) }
  / r:("/" @RelativePathExpr?) { return r ? bind('_root', r) : bind('_root') }
  / RelativePathExpr

RelativePathExpr "Relative Path"
  = head:StepExpr tail:(Slash StepExpr)*
  { return tail.length ? bind('_relative', head, tail.map(([s, e]) => bind('_step', s, e))) : head }

Slash
  = $"//"
  / $"/"

StepExpr
  = PostfixExpr
  / AxisStep

AxisStep
  = step:(ReverseStep / ForwardStep) predicates:PredicateList
  { return predicates.length ? bind('_filter', step, predicates) : step }

ForwardStep
  = s:(ForwardAxis NodeTest) { return bind(s[0], s[1]) }
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
  { return a ? bind('_attrib', t) : t }

ReverseStep
  = s:(ReverseAxis NodeTest) { return bind(s[0], s[1]) }
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
  { return bind('_parent') }

NodeTest
  = KindTest
  / NameTest

NameTest
  = w:Wildcard { return bind('_nameTestWildcard', w) }
  / q:EQName { return bind('_nameTest', q) }


Wildcard
  = "*"
  / $(NCName ":" "*")
  / $("*" ":" NCName)
  / (BracedURILiteral "*")

PostfixExpr
  = head:PrimaryExpr tail:(Predicate / ArgumentList)*
  { return tail.length ? bind('_postfix', head, tail) : head }

ArgumentList
  = "(" @Argument|1.., ","| ")"

PredicateList
  = Predicate*

Predicate
  = "[" e:Expr "]"
  { return bind('_pred', e) }

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
  = "." !"." { return bind('_dot') }

FunctionCall
  = fn:EQName ! {return reservedFnName(fn)} params:ArgumentList
  { return bind('_fn', fn, params) }

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
  = "as" _ SequenceType

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
  { return bind('_anyKindTest') }

DocumentTest
  = "document-node" "(" _ t:(ElementTest / SchemaElementTest)? _ ")"
  { return bind('_documentTest', t) }

TextTest
  = "text" "(" _ ")"
  { return bind('_textTest') }

CommentTest
  = "comment" "(" _ ")"
  { return bind('_comment') }

NamespaceNodeTest
  = "namespace-node" "(" _ ")"

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
  / [\uD800-\uDB7F][\uDC00-\uDFFF] /*  / [\u{10000}-\u{EFFFF}] */

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
  / [\uD800-\uDB7F][\uDC00-\uDFFF] /*  / [\u{10000}-\u{EFFFF}] */

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
  / [\uD800-\uDB7F][\uDC00-\uDFFF] /*  / [\u{10000}-\u{EFFFF}] */

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
  { return bind('_bracedURI', uri) }

EscapeQuot
  = $'""'
EscapeApos
  = $"''"
