{
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
}
XPath
  = Expr

Expr
  = head:ExprSingle tail:("," ExprSingle)*
  { return tail.length ? ['_comma', buildList(head, tail, 1)] : head }

ExprSingle
  = ForExpr
  / QuantifiedExpr
  / IfExpr
  / OrExpr

ForExpr
  = SimpleForClause "return" ExprSingle

SimpleForClause
  = "for" "$" VarName "in" ExprSingle ("," "$" VarName "in" ExprSingle)*

QuantifiedExpr
  = ("some" / "every") "$" VarName "in" ExprSingle ("," "$" VarName "in" ExprSingle)* "satisfies" ExprSingle

IfExpr
  = "if" "(" Expr ")" "then" ExprSingle "else" ExprSingle

OrExpr
  = head:AndExpr tail:("or" AndExpr)*
  { return tail.length ? ['_or', buildList(head, tail, 1)] : head }

AndExpr
  = head:ComparisonExpr tail:("and" ComparisonExpr)*
  { return tail.length ? ['_and', buildList(head, tail, 1)] : head}

ComparisonExpr
  = head:RangeExpr tail:( _ (ValueComp / GeneralComp / NodeComp) _ RangeExpr )?
  { return tail ? ['_compare', head, tail[1], tail[3]] : head }

RangeExpr
  = head:AdditiveExpr tail:( "to" AdditiveExpr )?
  { return tail ? ['_range', head, tail[1]] : head }

AdditiveExpr
  = head:MultiplicativeExpr tail:( ("+" / "-") MultiplicativeExpr )*
  { return tail.length ? ['_add', head, tail] : head }

MultiplicativeExpr
  = head:UnionExpr tail:( ("*" / "div" / "idiv" / "mod") UnionExpr )*
  { return tail.length ? ['_mult', head, tail] : head }

UnionExpr
  = head:IntersectExceptExpr tail:( ("union" / "/") IntersectExceptExpr )*
  { return tail.length ? ['_union', head, tail] : head }

IntersectExceptExpr
  = head:InstanceofExpr tail:( ("intersect" / "except") InstanceofExpr )*
  { return tail.length ? ['_intersect', head, tail] : head }

InstanceofExpr
  = head:TreatExpr tail:( "instance" "of" SequenceType )?
  { return tail ? ['_instanceOf', head, tail] : head }

TreatExpr
  = head:CastableExpr tail:( "treat" "as" SequenceType )?
  { return tail ? ['_treatAs', head, tail] : head }

CastableExpr
  = head:CastExpr tail:( "castable" "as" SingleType )?
  { return tail ? ['_castableAs', head, tail] : head }

CastExpr
  = head:UnaryExpr tail:( "cast" "as" SingleType )?
  { return tail ? ['_castableAs', head, tail] : head }

UnaryExpr
  = op:$("-" / "+")* val:ValueExpr
  { return op ? ['_op', op, val] : val }

ValueExpr
  = PathExpr

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

PathExpr
  = AllRelative
  / RootRelative
  / RelativePathExpr

AllRelative
  = "//" r:RelativePathExpr { return ['_all', r] }

RootRelative
  = "/" r:RelativePathExpr? { return r ? ['_root', r] : ['_root'] }

RelativePathExpr
  = head:StepExpr tail:(Slash StepExpr)*
  { return tail.length ? ['_relative', head, tail.map(([s, e]) => ['_step', s, e])] : head }

Slash
  = "//"
  / "/"

StepExpr
  = FilterExpr
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
  { return '_' + a[0] }

AbbrevForwardStep
  = a:"@"? t:NodeTest { return a ? ['_attrib', t] : t }

ReverseStep
  = AbbrevReverseStep
  / (ReverseAxis NodeTest)

ReverseAxis
  = ("parent" "::")
  / ("ancestor" "::")
  / ("preceding-sibling" "::")
  / ("preceding" "::")
  / ("ancestor-or-self" "::")

AbbrevReverseStep
  = ".." { return ['_parent'] }

NodeTest
  = KindTest
  / NameTest

NameTest
  = q:QName { return ['_nameTest', q]}
  / w:Wildcard { return ['_nameTestWildcard', w] }

Wildcard
  = "*"
  / $(NCName ":" "*")
  / $("*" ":" NCName)

FilterExpr
  = primary:PrimaryExpr predicate:PredicateList
  { return predicate.length ? ['_filter', primary, predicate] : primary }

PredicateList
  = Predicate*

Predicate
  = "[" e:Expr "]"
  { return ['_pred', e] }

PrimaryExpr
  = VarRef
  / ContextItemExpr
  / FunctionCall
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
  = "$" v:VarName { return ['_varRef', v] }

VarName
  = QName

ParenthesizedExpr
  = "(" e:Expr? ")" { return e ? e : undefined }

ContextItemExpr
  = "."
  { return ['_dot'] }

FunctionCall
  = fn:QName ! {return reservedFnName(fn)} "(" _ params:FunctionParams? _ ")"
  { return params ? ['_fn', fn, params] : ['_fn', fn] }

FunctionParams
  = head:ExprSingle tail:(_ "," _ ExprSingle)*
  { return buildList(head, tail, 3) }

SingleType
  = AtomicType "?"?

SequenceType
  = ("empty-sequence" "(" ")")
  / (ItemType OccurrenceIndicator?)

OccurrenceIndicator
  = "?"
  / "*"
  / "+"

ItemType
  = KindTest
  / ("item" "(" ")")
  / AtomicType

AtomicType
  = QName

KindTest
  = DocumentTest
  / AttributeTest
  / SchemaElementTest
  / SchemaAttributeTest
  / PITest
  / CommentTest
  / TextTest
  / AnyKindTest
  / ElementTest

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
  = "comment" "(" _ ")"
  { return [ '_commentTest' ] }

PITest
  = "processing-instruction" "(" lit:(NCName / StringLiteral)? ")"
  { return ['_piTest', lit] }

AttributeTest
  = "attribute" "(" (a:AttribNameOrWildcard ("," t:TypeName)?)? ")"
  { return ['_attributeTest', a, t] }

AttribNameOrWildcard
  = AttributeName
  / "*"

SchemaAttributeTest
  = "schema-attribute" "(" AttributeDeclaration ")"

AttributeDeclaration
  = AttributeName

ElementTest
  = "element" "(" (ElementNameOrWildcard ("," TypeName "?"?)?)? ")"

ElementNameOrWildcard
  = ElementName
  / "*"

SchemaElementTest
  = "schema-element" "(" ElementDeclaration ")"

ElementDeclaration
  = ElementName

AttributeName
  = QName

ElementName
  = QName

TypeName
  = QName

IntegerLiteral
  = d:Digits
  { return parseInt(d, 10) }

DecimalLiteral
  = d:$(("." Digits) / (Digits "." [0-9]*))
  { return parseFloat(d) }

DoubleLiteral
  = d:((("." Digits) / (Digits ("." [0-9]*)?)) [eE] [+-]? Digits)
  { return parseFloat(d) }

StringLiteral
  = s:('"' $(EscapeQuot / [^"])* '"') { return s[1] }
  / s:("'" $(EscapeApos / [^'])* "'") { return s[1] }

EscapeQuot
  = '""'

EscapeApos
  = "''"

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