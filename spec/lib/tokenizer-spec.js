/* eslint-disable max-classes-per-file */
/* eslint-disable no-array-constructor */
/* eslint-disable no-magic-numbers */

import * as _TestHelpers from '../support/test-helpers.js';

import {
  Tokenizer,
} from '../../lib/index.js';

const {
  $,
  $all,
  $any,
  $fragment,
  $pattern,
  $repeat,
  $message,
} = Tokenizer;

describe('Tokenizer', () => {
  describe('$pattern', () => {
    it('works', () => {
      let context = Tokenizer.createPatternContext('testIng');

      let result = $pattern(/test/g)(context);
      expect(result).toMatchSnapshot();

      context.start = 4;
      expect($pattern.name('Test')(/ing/ig)(context)).toMatchSnapshot();
    });

    it('works with named groups', () => {
      let context = Tokenizer.createPatternContext('testIng');

      let result = $pattern(/(?<capture>test)/g)(context);
      expect(result).toMatchSnapshot();
    });
  });

  describe('$any', () => {
    it('works', () => {
      let context = Tokenizer.createPatternContext('testIng');

      let $program = $any(
        $pattern.name('Whitespace')(/\s+/g),
        $pattern.name('Word')(/\w+/g),
      );

      expect($program(context)).toMatchSnapshot();
    });
  });

  describe('$all', () => {
    it('works', () => {
      let context = Tokenizer.createPatternContext('  testIng');

      let $program = $all.name('Program')(
        $pattern.name('Whitespace')(/\s+/g),
        $pattern.name('Word')(/\w+/g),
      );

      expect($program(context)).toMatchSnapshot();
    });

    it('can discard tokens', () => {
      let context = Tokenizer.createPatternContext('  testIng');

      let $program = $all.name('Program')(
        $pattern.name('Whitespace').discard(true)(/\s+/g),
        $pattern.name('Word')(/\w+/g),
      );

      expect($program(context)).toMatchSnapshot();
    });
  });

  describe('$repeat', () => {
    it('works', () => {
      let context = Tokenizer.createPatternContext('  one  two  three  ');

      let $program = $all.name('Program')(
        $pattern.name('Whitespace').discard(true)(/\s+/g),
        $pattern.name('Word').optional()(/\w+/g),
      );

      let $loop = $repeat.name('Loop')($program);
      expect($loop(context)).toMatchSnapshot();
    });
  });

  describe('$fragment', () => {
    it('works', () => {
      let context = Tokenizer.createPatternContext('  one  two  three  ');

      let $program = $all.name('Program')(
        $pattern.name('Whitespace').discard(true)(/\s+/g),
        $pattern.name('Word').optional(true)(/\w+/g),
      );

      let $loop = $repeat.name('Loop')($fragment($program));
      expect($loop(context)).toMatchSnapshot();
    });

    it('works2', () => {
      let context = Tokenizer.createPatternContext('  one  two  three  ');

      let $program = $all.name('Program')(
        $pattern.name('Whitespace').discard(true)(/\s+/g),
        $pattern.name('Word')(/\w+/g),
      );

      let $loop = $repeat.name('Loop')($($program));
      expect($loop(context)).toMatchSnapshot();
    });
  });

  describe('$message', () => {
    it('works', () => {
      let context = Tokenizer.createPatternContext('  10  two  three  ');

      let $program = $all.name('Program')(
        $pattern.name('Whitespace').discard(true)(/\s+/g),
        $pattern.name('Word').optional()(/[a-zA-Z]+/g),
        $message.type('error')('Unable to parse!'),
      );

      let $loop = $repeat.name('Loop')($program);
      expect($loop(context)).toMatchSnapshot();
    });
  });
});
