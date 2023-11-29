/* eslint-disable max-classes-per-file */
/* eslint-disable no-array-constructor */
/* eslint-disable no-magic-numbers */

import * as _TestHelpers from '../support/test-helpers.js';

import {
  Tokenizer,
  CSS,
} from '../../lib/index.js';
import { compressComments } from '../../lib/css.js';

const {
  $any,
  $pattern,
  $repeat,
} = Tokenizer;

const {
  $atKeyword,
  $comment,
  $dimension,
  $error,
  $escape,
  $function,
  $hash,
  $hexDigit,
  $identifier,
  $newline,
  $number,
  $percentage,
  $string,
  $unicodeRange,
  $url,
  $whitespace,
} = CSS;

describe('CSS', () => {
  describe('$error', () => {
    it('works', () => {
      let context = Tokenizer.createPatternContext('test');
      expect($error('Test Error')(context)).toMatchSnapshot();
    });
  });

  describe('$comment', () => {
    it('works', () => {
      let context = Tokenizer.createPatternContext('/* comment */');
      expect($comment(context)).toMatchSnapshot();
    });

    it('can compress comments', () => {
      let context = Tokenizer.createPatternContext('/* comment1 */ /* comment2 */ stuff /* comment3 */');
      let $program = $repeat(
        $any(
          $whitespace.discard(true),
          $comment,
          $identifier,
        ),
      );

      let result = $program(context);
      expect(result).toMatchSnapshot();

      result.children = compressComments(context, result.children);
      expect(result).toMatchSnapshot();
    });
  });

  describe('$newline', () => {
    it('works', () => {
      let context   = Tokenizer.createPatternContext('\n\r\n\r\f');
      let $program  = $repeat($newline);

      expect($program(context)).toMatchSnapshot();
    });
  });

  describe('$whitespace', () => {
    it('works', () => {
      let context   = Tokenizer.createPatternContext('\t\n\r\n\r\f ');
      let $program  = $repeat($whitespace);

      expect($program(context)).toMatchSnapshot();
    });
  });

  describe('$hexDigit', () => {
    it('works', () => {
      let context   = Tokenizer.createPatternContext('0|f0|dd|cdf|abc1|a0cdef');
      let $program  = $repeat(
        $any(
          $hexDigit,
          $pattern.discard(true)(/\|/),
        ),
      );

      expect($program(context)).toMatchSnapshot();
    });
  });

  describe('$escape', () => {
    it('works', () => {
      let context   = Tokenizer.createPatternContext('\\\\\\.\\ \\1f303');
      let $program  = $repeat($escape);

      expect($program(context)).toMatchSnapshot();
    });
  });

  describe('$identifier', () => {
    it('works', () => {
      const test = (src) => {
        let context = Tokenizer.createPatternContext(src);
        return $identifier(context);
      };

      // Success
      expect(test('a')).toMatchSnapshot();
      expect(test('abc0_01d-')).toMatchSnapshot();
      expect(test('--0abc0_01d-')).toMatchSnapshot();
      expect(test('--_abc0_01d-')).toMatchSnapshot();
      expect(test('---abc0_01d-')).toMatchSnapshot();
      expect(test('---a\\ bc0_01d-')).toMatchSnapshot();
      expect(test('---a\\1f303x_01d-')).toMatchSnapshot();
      expect(test('-a')).toMatchSnapshot();
      expect(test('_Z')).toMatchSnapshot();
      expect(test('Z')).toMatchSnapshot();

      // Fail
      expect(test('-0')).toBe(undefined);
      expect(test('0')).toBe(undefined);
      expect(test('0a')).toBe(undefined);
    });
  });

  describe('$function', () => {
    it('works', () => {
      const test = (src) => {
        let context = Tokenizer.createPatternContext(src);
        return $function(context);
      };

      // Success
      expect(test('a(')).toMatchSnapshot();
      expect(test('abc0_01d-(')).toMatchSnapshot();
      expect(test('--0abc0_01d-(')).toMatchSnapshot();
      expect(test('--_abc0_01d-(')).toMatchSnapshot();
      expect(test('---abc0_01d-(')).toMatchSnapshot();
      expect(test('---a\\ bc0_01d-(')).toMatchSnapshot();
      expect(test('---a\\1f303x_01d-(')).toMatchSnapshot();
      expect(test('-a(')).toMatchSnapshot();
      expect(test('_Z(')).toMatchSnapshot();
      expect(test('Z(')).toMatchSnapshot();

      // Fail
      expect(test('-0(')).toBe(undefined);
      expect(test('0(')).toBe(undefined);
      expect(test('0a(')).toBe(undefined);
    });
  });

  describe('$atKeyword', () => {
    it('works', () => {
      const test = (src) => {
        let context = Tokenizer.createPatternContext(src);
        return $atKeyword(context);
      };

      // Success
      expect(test('@a')).toMatchSnapshot();
      expect(test('@abc0_01d-')).toMatchSnapshot();
      expect(test('@--0abc0_01d-')).toMatchSnapshot();
      expect(test('@--_abc0_01d-')).toMatchSnapshot();
      expect(test('@---abc0_01d-')).toMatchSnapshot();
      expect(test('@---a\\ bc0_01d-')).toMatchSnapshot();
      expect(test('@---a\\1f303x_01d-')).toMatchSnapshot();
      expect(test('@-a')).toMatchSnapshot();
      expect(test('@_Z')).toMatchSnapshot();
      expect(test('@Z')).toMatchSnapshot();

      // Fail
      expect(test('@-0')).toBe(undefined);
      expect(test('@0')).toBe(undefined);
      expect(test('@0a')).toBe(undefined);
    });
  });

  describe('$hash', () => {
    it('works', () => {
      const test = (src) => {
        let context = Tokenizer.createPatternContext(src);
        return $hash(context);
      };

      // Success
      expect(test('#a')).toMatchSnapshot();
      expect(test('#abc0_01d-')).toMatchSnapshot();
      expect(test('#--0abc0_01d-')).toMatchSnapshot();
      expect(test('#--_abc0_01d-')).toMatchSnapshot();
      expect(test('#---abc0_01d-')).toMatchSnapshot();
      expect(test('#---a\\ bc0_01d-')).toMatchSnapshot();
      expect(test('#---a\\1f303x_01d-')).toMatchSnapshot();
      expect(test('#-a')).toMatchSnapshot();
      expect(test('#_Z')).toMatchSnapshot();
      expect(test('#Z')).toMatchSnapshot();
      expect(test('#-0')).toMatchSnapshot();
      expect(test('#0')).toMatchSnapshot();
      expect(test('#0a')).toMatchSnapshot();
      expect(test('#0a something else')).toMatchSnapshot();
    });
  });

  describe('$string', () => {
    it('works', () => {
      const test = (src) => {
        let context = Tokenizer.createPatternContext(src);
        return $string(context);
      };

      // Success
      expect(test('\'test\'')).toMatchSnapshot();
      expect(test('\'test \\\'substring\\\' here\'')).toMatchSnapshot();
      expect(test('\'test "substring" here\'')).toMatchSnapshot();
      expect(test('\'test "substring" \\\nhere\'')).toMatchSnapshot();
      expect(test('"test"')).toMatchSnapshot();
      expect(test('"test \\"substring\\" here"')).toMatchSnapshot();
      expect(test('"test \'substring\' here"')).toMatchSnapshot();
      expect(test('"test \'substring\' \\\nhere"')).toMatchSnapshot();
      expect(test('"Starry Night \\1f303"')).toMatchSnapshot();
    });
  });

  describe('$url', () => {
    it('works', () => {
      const test = (src) => {
        let context = Tokenizer.createPatternContext(src);
        return $url(context);
      };

      // Success
      expect(test('url(https://test.com)')).toMatchSnapshot();
      expect(test('url(http://www.test.com/hello+world/folder-name/index.html)')).toMatchSnapshot();
      expect(test('url( https://test.com )')).toMatchSnapshot();
      expect(test('url( \nhttps://test.com\n )')).toMatchSnapshot();
    });
  });

  describe('$number', () => {
    it('works', () => {
      const test = (src) => {
        let context = Tokenizer.createPatternContext(src);
        return $number(context);
      };

      // Success
      expect(test('42')).toMatchSnapshot();
      expect(test('+42')).toMatchSnapshot();
      expect(test('-42')).toMatchSnapshot();
      expect(test('-42e-1')).toMatchSnapshot();
      expect(test('42.1234')).toMatchSnapshot();
      expect(test('+42.1234')).toMatchSnapshot();
      expect(test('-42.1234')).toMatchSnapshot();
      expect(test('-.1234e-1')).toMatchSnapshot();
      expect(test('-.1234e+1')).toMatchSnapshot();
      expect(test('+.1234E+1')).toMatchSnapshot();
      expect(test('+.1234E-1')).toMatchSnapshot();
    });
  });

  describe('$dimension', () => {
    it('works', () => {
      const test = (src) => {
        let context = Tokenizer.createPatternContext(src);
        return $dimension(context);
      };

      // Success
      expect(test('12.43px')).toMatchSnapshot();
      expect(test('-.43em')).toMatchSnapshot();
      expect(test('0pt')).toMatchSnapshot();
    });
  });

  describe('$percentage', () => {
    it('works', () => {
      const test = (src) => {
        let context = Tokenizer.createPatternContext(src);
        return $percentage(context);
      };

      // Success
      expect(test('12.43%')).toMatchSnapshot();
      expect(test('-.43%')).toMatchSnapshot();
      expect(test('0%')).toMatchSnapshot();
    });
  });

  describe('$unicodeRange', () => {
    it('works', () => {
      const test = (src) => {
        let context = Tokenizer.createPatternContext(src);
        return $unicodeRange(context);
      };

      // Success
      expect(test('U+AA-00FF')).toMatchSnapshot();
      expect(test('U+AA??')).toMatchSnapshot();
      expect(test('U+0AFF')).toMatchSnapshot();
    });
  });
});
