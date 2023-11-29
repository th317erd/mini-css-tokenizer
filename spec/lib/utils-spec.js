/* eslint-disable max-classes-per-file */
/* eslint-disable no-array-constructor */
/* eslint-disable no-magic-numbers */

import * as _TestHelpers from '../support/test-helpers.js';

import {
  Utils,
} from '../../lib/index.js';

describe('Utils', () => {
  describe('cloneRegExp', () => {
    it('works', () => {
      const test = (regexp, forceFlags, disallowFlags) => {
        let result = Utils.cloneRegExp(regexp, forceFlags, disallowFlags);
        expect(result !== regexp).toBe(true);
        return { source: result.source, flags: result.flags };
      };

      expect(test(/hello/)).toEqual({ source: 'hello', flags: '' });
      expect(test(/hello/g)).toEqual({ source: 'hello', flags: 'g' });
      expect(test(/hello/, [ 'g' ])).toEqual({ source: 'hello', flags: 'g' });
      expect(test(/hello/, [ 'i', 'g' ])).toEqual({ source: 'hello', flags: 'gi' });
      expect(test(/hello/i, [ 'g' ])).toEqual({ source: 'hello', flags: 'gi' });
      expect(test(/hello/ig, [ 'g' ], [ 'g' ])).toEqual({ source: 'hello', flags: 'gi' });
      expect(test(/hello/ig, [ 'g' ], [ 'i' ])).toEqual({ source: 'hello', flags: 'g' });
      expect(test(/hello/ig, null, [ 'i', 'g' ])).toEqual({ source: 'hello', flags: '' });
      expect(test(/hello/ig, null, 'ig')).toEqual({ source: 'hello', flags: '' });
      expect(test(/hello/ig, 'mi', 'ig')).toEqual({ source: 'hello', flags: 'im' });
    });
  });

  describe('attributableMethod', () => {
    it('works', () => {
      let customMethod = Utils.attributableMethod((attributes, ...args) => {
        return { attributes, args };
      }, { value: undefined, name: undefined, hello: undefined });

      expect(customMethod('test')).toEqual({
        attributes: {
          value:  undefined,
          name:   undefined,
          hello:  undefined,
        },
        args: [
          'test',
        ],
      });

      expect(customMethod.name('test').value(1).hello('world')(42, Math.PI)).toEqual({
        attributes: {
          value:  1,
          name:   'test',
          hello:  'world',
        },
        args: [
          42,
          Math.PI,
        ],
      });
    });
  });
});
