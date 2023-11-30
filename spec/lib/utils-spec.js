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

  describe('isPlainObject', () => {
    it('works', () => {
      class Test {}

      expect(Utils.isPlainObject(undefined)).toBe(false);
      expect(Utils.isPlainObject(null)).toBe(false);
      expect(Utils.isPlainObject(NaN)).toBe(false);
      expect(Utils.isPlainObject(Infinity)).toBe(false);
      expect(Utils.isPlainObject('test')).toBe(false);
      expect(Utils.isPlainObject(new String('test'))).toBe(false);
      expect(Utils.isPlainObject(2.0)).toBe(false);
      expect(Utils.isPlainObject(new Number(2.0))).toBe(false);
      expect(Utils.isPlainObject(true)).toBe(false);
      expect(Utils.isPlainObject(false)).toBe(false);
      expect(Utils.isPlainObject(new Boolean(true))).toBe(false);
      expect(Utils.isPlainObject(BigInt(1))).toBe(false);
      expect(Utils.isPlainObject(new Map())).toBe(false);
      expect(Utils.isPlainObject(new Set())).toBe(false);
      expect(Utils.isPlainObject(new Array())).toBe(false);
      expect(Utils.isPlainObject(new Map())).toBe(false);
      expect(Utils.isPlainObject(new Test())).toBe(false);
      expect(Utils.isPlainObject(new Object())).toBe(true);
      expect(Utils.isPlainObject({})).toBe(true);
      expect(Utils.isPlainObject(Object.create(null))).toBe(true);
    });
  });
});
