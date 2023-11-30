import * as Utils     from './utils.js';
import * as Tokenizer from './tokenizer/index.js';

const {
  $,
  $all,
  $any,
  $context,
  $map,
  $message,
  $pattern,
  $repeat,
} = Tokenizer;

export const $error = $message.type('error').name('error');

export const $comment = $map.successOnly(true)(
  $pattern.name('comment')(/\/\*.*?\*\//),
  ({ token }) => {
    token.setAttribute('raw', token.value);
    token.value = token.value.substring(2, token.value.length - 2).trim();
  },
);

export const $newline     = $pattern.name('newline')(/\n|\r\n|\r|\f/);
export const $whitespace  = $pattern.name('whitespace')(/(?:\t|\n|\r\n|\r|\f|\s)+/);

export const $wsOrComment = $any(
  $whitespace.discard(true),
  $comment,
);

export const $hexDigit    = $pattern.name('hexDigit')(/[0-9a-fA-F]{1,6}/);
export const $escape      = $map.successOnly(true)(
  $all.name('escape')(
    $pattern(/\\/),
    $any(
      $hexDigit.setAttribute('escaped', true),
      $whitespace.setAttribute('escaped', true),
      $pattern.setAttribute('escaped', true).name('character')(/./),
    ),
  ),
  ({ token }) => {
    token.value = token.value.substring(1);

    let type = token.children[1].name;
    if (type === 'hexDigit')
      token.value = String.fromCodePoint(parseInt(token.value, 16));

    token.setAttribute('type', type);

    delete token.children;
  },
);

export const $identifier  = $map.successOnly(true)(
  $any(
    $all.name('identifier')(
      $pattern(/--/),
      $repeat.fragment(true)(
        $any(
          $escape,
          $pattern.name('character')(/[_a-zA-Z0-9-]/),
        ),
      ),
    ),
    $all.name('identifier')(
      $pattern(/-?/),
      $repeat.optional(true)($escape),
      $pattern.name('character')(/[_a-zA-Z]/),
      $repeat.optional(true).fragment(true)(
        $any(
          $escape,
          $pattern.name('character')(/[_a-zA-Z0-9-]/),
        ),
      ),
    ),
  ),
  ({ token }) => {
    token.value = token.children.map((child) => child.value).join('');
    delete token.children;
  },
);

export const $function = $map.successOnly(true)(
  $all.name('function')(
    $identifier,
    () => $parenthesisBlock,
  ),
  ({ token }) => {
    token.value = token.children[0].value;
    delete token.children;
  },
);

export const $atKeyword = $map.successOnly(true)(
  $all.name('atKeyword')(
    $pattern.discard(true)(/@/),
    $identifier,
  ),
  ({ context, token }) => {
    if (token.nested == null)
      token.nested = context.fetch('nested', false);

    token.value = token.children[0].value;
    delete token.children;
  },
);

export const $hash = $map.successOnly(true)(
  $all.name('hash')(
    $pattern.discard(true)(/#/),
    $repeat.fragment(true)(
      $any(
        $escape,
        $pattern.name('character')(/[_a-zA-Z0-9-]/), // TODO: Needs "non-ascii" support
      ),
    ),
  ),
  ({ token }) => {
    token.id = true;
    token.value = token.children.map((child) => child.value).join('');
    token.raw = `#${token.value}`;

    delete token.children;
  },
);

export const $string = $map.successOnly(true)(
  $any(
    $all.name('string')(
      $pattern(/"/),
      $repeat.fragment(true)(
        $any(
          $escape,
          $pattern.name('character')(/[^"]/),
        ),
      ),
      $pattern(/"/),
    ),
    $all.name('string')(
      $pattern(/'/),
      $repeat.fragment(true)(
        $any(
          $escape,
          $pattern.name('character')(/[^']/),
        ),
      ),
      $pattern(/'/),
    ),
  ),
  ({ token }) => {
    let rawValue = token.children.map((child) => child.value).join('');
    token.setAttribute('raw', rawValue);

    token.value = rawValue.substring(1, rawValue.length - 1);

    delete token.children;
  },
);

export const $url = $map.successOnly(true)(
  $all.name('url')(
    $pattern.discard(true)(/url\(/i),
    $whitespace.optional(true).discard(true),
    $repeat.fragment(true)(
      $any(
        $escape,
        $pattern.name('character')(/[^"'()\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u),
      ),
    ),
    $whitespace.optional(true).discard(true),
    $pattern.discard(true)(/\)/),
  ),
  ({ token }) => {
    token.value = token.children.map((child) => child.value).join('');
    delete token.children;
  },
);

export const $number = $map.successOnly(true)(
  $pattern.name('number')(/(?<sign>[+-])?(?<number>\d*?\.\d+|\d+)(?<exponent>[eE][+-]\d+)?/),
  ({ token }) => {
    token.value = parseFloat(token.value);
  },
);

export const $dimension = $map.successOnly(true)(
  $all.name('dimension')(
    $number,
    $identifier,
  ),
  ({ token }) => {
    token.raw     = token.value;
    token.number  = token.children[0].value;
    token.unit    = token.children[1].value;
    token.value   = token.number;

    delete token.children;
  },
);

export const $percentage = $map.successOnly(true)(
  $all.name('percentage')(
    $number,
    $pattern.discard(true)(/%/),
  ),
  ({ token }) => {
    token.raw     = token.value;
    token.value   = token.children[0].value;

    // eslint-disable-next-line no-magic-numbers
    token.ratio   = token.value / 100.0;

    delete token.children;
  },
);

export const $unicodeRange = $map.successOnly(true)(
  $any(
    $all.name('unicodeRange')(
      $pattern.discard(true)(/[uU]\+/),
      $hexDigit,
      $pattern.discard(true)(/-/),
      $hexDigit,
    ),
    $all.name('unicodeRange')(
      $pattern.discard(true)(/[uU]\+/),
      $pattern.name('hexDigit')(/[0-9a-fA-F?]{1,6}/),
    ),
    $all.name('unicodeRange')(
      $pattern.discard(true)(/[uU]\+/),
      $hexDigit,
    ),
  ),
  ({ token }) => {
    if (token.children.length > 1) {
      token.rangeStart  = token.children[0].value;
      token.rangeEnd    = token.children[1].value;
    } else {
      let value = token.children[0].value;
      if (value.indexOf('?') >= 0) {
        token.rangeStart  = value.replace(/\?/g, '0');
        token.rangeEnd    = value.replace(/\?/g, 'F');
      } else {
        token.rangeStart  = value;
        token.rangeEnd    = value;
      }
    }

    delete token.children;
  },
);

const cc = (type, pattern) => $pattern.name('combinator').setAttribute('type', type)(pattern);

export const $descendantCombinator        = cc('descendant',        /\s+/);
export const $childCombinator             = cc('child',             />/);
export const $subsequentSiblingCombinator = cc('subsequentSibling', /~/);
export const $nextSiblingCombinator       = cc('nextSibling',       /\+/);
export const $columnCombinator            = cc('column',            /\|\|/);
export const $namespaceCombinator         = cc('namespace',         /\|/);

export const $combinator = $any(
  $descendantCombinator,
  $childCombinator,
  $subsequentSiblingCombinator,
  $nextSiblingCombinator,
  $columnCombinator,
  $namespaceCombinator,
);

export const $attributeSelector = $all.name('selector').setAttribute('type', 'attribute')(
  $pattern.discard(true)(/\[/),
  $identifier,
  $pattern.discard(true)(/\]/),
);

export const $componentValue = $any(
  $wsOrComment,
  $escape,
  $url,
  $function,
  $unicodeRange,
  $string,
  $hexDigit,
  $number,
  $percentage,
  $dimension,
  $hash,
  $identifier,
);

export const $declarationRecovery = $pattern.discard(true)(/[^;)}\]]+/);

export const $declaration = $map.successOnly(true)(
  $all(
    $identifier,
    $wsOrComment.optional(true),
    $pattern.discard(true)(/:/),
    $repeat($componentValue),
    $pattern.optional(true)(/important!/i),
    $pattern.discard(true)(/;/),
  ),
  () => {

  },
);

export const $curlyBraceBlock = $all.name('block')(
  $pattern.discard(true)(/\{/),
  $repeat(
    $any(
      $wsOrComment,
      $declaration,
    ),
  ),
  $pattern.discard(true)(/\}/),
);

export const $squareBraceBlock = $all.name('block')(
  $pattern.discard(true)(/\[/),
  $repeat(
    $any(
      $wsOrComment,
      $declaration,
    ),
  ),
  $pattern.discard(true)(/\]/),
);

export const $parenthesisBlock = $all.name('block')(
  $pattern.discard(true)(/\(/),
  $repeat.optional(true).fragment(true)(
    $any($componentValue),
  ),
  $pattern.discard(true)(/\)/),
);

export const $block = $context(
  { nested: true },
  $any(
    // Block starting with {
    $curlyBraceBlock,
    $squareBraceBlock,
    $parenthesisBlock,
  ),
);

export const $css = $all.name('css')(
  $pattern.discard(true).optional(true)(/\s*<!--/),
  $repeat($wsOrComment.optional(true)),
  $pattern.discard(true).optional(true)(/\s*-->/),
);

export function parseCSS(_styleSheetString) {
  let styleSheetString = _styleSheetString || '';
}
