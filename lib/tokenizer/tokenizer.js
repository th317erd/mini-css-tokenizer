import * as Utils from '../utils.js';

function collectPatterns(patterns) {
  return patterns.map((pattern) => {
    if (typeof pattern !== 'function')
      return;

    if (!pattern[Utils.ATTRIBUTABLE_METHOD])
      return pattern();

    return pattern;
  }).filter(Boolean);
}

export class Token {
  static DEFAULT_TOKEN_ATTRIBUTES = {
    name:     'token',
    optional: undefined,
    discard:  undefined,
    fragment: undefined,
  };

  constructor(attributes) {
    let attributeNames = Object.keys(attributes || {});
    for (let i = 0, il = attributeNames.length; i < il; i++) {
      let attributeName   = attributeNames[i];
      let attributeValue  = attributes[attributeName];
      if (attributeValue == null)
        continue;

      this.setAttribute(attributeName, attributeValue);
    }
  }

  getAttribute(name) {
    return this[name];
  }

  setAttribute(name, value) {
    Object.defineProperty(this, name, {
      writable:     true,
      enumerable:   true,
      configurable: true,
      value:        value,
    });

    return this;
  }

  clone(attributes) {
    return new this.constructor({
      ...this,
      ...(attributes || {}),
    });
  }
}

export function $(callback, attributes) {
  return Utils.attributableMethod((attributes, ...args) => {
    let pattern = callback(attributes, ...args);
    return pattern.setAttributes(attributes)(...args);
  }, { ...Token.DEFAULT_TOKEN_ATTRIBUTES, name: undefined, ...(attributes || {}) }, {});
}

export const $pattern = Utils.attributableMethod((attributes, _pattern) => {
  let pattern = Utils.cloneRegExp(_pattern, 'g');

  return Utils.attributableMethod((attributes, context) => {
    pattern.lastIndex = context.start;

    let result = pattern.exec(context.content);
    if (!result || result.index !== context.start)
      return;

    let tokenAttributes = {
      ...attributes,
      start:  context.start,
      end:    context.start + result[0].length,
      value:  result[0],
      ...(result.groups || {}),
    };

    if (attributes.indices === true)
      Object.assign(tokenAttributes, Array.from(result).slice(1));

    return new Token(tokenAttributes);
  }, { ...Token.DEFAULT_TOKEN_ATTRIBUTES, ...attributes });
}, { ...Token.DEFAULT_TOKEN_ATTRIBUTES, indices: undefined });

export const $any = Utils.attributableMethod((attributes, ..._patterns) => {
  let patterns = _patterns.filter(Boolean);

  return Utils.attributableMethod((attributes, _context) => {
    let context = _context.clone();
    let end     = context.start;

    for (let pattern of collectPatterns(patterns)) {
      let result = pattern(context);
      if (!result)
        continue;

      context.start = result.end;
      if (result.end > end)
        end = result.end;

      if (result.getAttribute('discard'))
        continue;

      return result;
    }

    if (_context.start !== context.start) {
      return new Token({
        start:    _context.start,
        end:      end,
        value:    null,
        fragment: true,
        discard:  true,
        children: [],
      });
    }
  }, { ...Token.DEFAULT_TOKEN_ATTRIBUTES, ...attributes });
}, Token.DEFAULT_TOKEN_ATTRIBUTES);

export const $all = Utils.attributableMethod((attributes, ..._patterns) => {
  let patterns = _patterns.filter(Boolean);

  return Utils.attributableMethod((attributes, _context) => {
    let context = _context.clone();
    let tokens  = [];
    let failed  = false;
    let end     = context.start;

    for (let pattern of collectPatterns(patterns)) {
      let result = pattern(context);
      if (!result) {
        if (pattern.getAttribute('optional'))
          continue;

        failed = true;
        break;
      }

      context.start = result.end;
      if (result.end > end)
        end = result.end;

      if (result.getAttribute('discard'))
        continue;

      if (result.getAttribute('fragment'))
        tokens = tokens.concat(result.children || []);
      else
        tokens.push(result);
    }

    if (failed)
      return;

    let token = new Token({
      ...attributes,
      start:    _context.start,
      end:      end,
      value:    context.content.substring(_context.start, end),
      children: tokens,
    });

    return (token.children.length === 0) ? token.setAttribute('fragment', true) : token;
  }, { ...Token.DEFAULT_TOKEN_ATTRIBUTES, ...attributes });
}, Token.DEFAULT_TOKEN_ATTRIBUTES);

export const $repeat = Utils.attributableMethod((attributes, ...__patterns) => {
  let _patterns = __patterns.filter(Boolean);

  return Utils.attributableMethod((attributes, _context) => {
    let context   = _context.clone();
    let tokens    = [];
    let done      = false;
    let end       = context.start;
    let patterns  = collectPatterns(_patterns);

    while (!done) {
      for (let pattern of patterns) {
        if (context.start >= context.end) {
          done = true;
          break;
        }

        let result = pattern(context);
        if (!result) {
          if (pattern.getAttribute('optional'))
            continue;

          done = true;
          break;
        }

        context.start = result.end;
        if (result.end > end)
          end = result.end;

        if (pattern.getAttribute('discard'))
          continue;

        if (result.getAttribute('fragment'))
          tokens = tokens.concat(result.children || []);
        else
          tokens.push(result);
      }
    }

    // Failed if nothing was consumed
    if (tokens.length === 0 && _context.start === context.start)
      return;

    return new Token({
      ...attributes,
      start:    _context.start,
      end:      end,
      value:    context.content.substring(_context.start, end),
      children: tokens,
    });
  }, { ...Token.DEFAULT_TOKEN_ATTRIBUTES, ...attributes });
}, Token.DEFAULT_TOKEN_ATTRIBUTES);

export const $fragment = Utils.attributableMethod((attributes, _pattern) => {
  return Utils.attributableMethod((attributes, context) => {
    let [ pattern ] = collectPatterns([ _pattern ]);
    let result = pattern(context);
    if (result)
      return result.setAttribute('fragment', true);

    return result;
  }, { ...Token.DEFAULT_TOKEN_ATTRIBUTES, ...attributes });
}, Token.DEFAULT_TOKEN_ATTRIBUTES);

export const $message = Utils.attributableMethod((attributes, message, recoveryHelper) => {
  return Utils.attributableMethod((attributes, context) => {
    let token = new Token({
      ...attributes,
      start:  context.start,
      end:    context.start,
      value:  message,
    });

    if (typeof recoveryHelper === 'function')
      return recoveryHelper({ context, attributes, token });

    return token;
  }, { ...Token.DEFAULT_TOKEN_ATTRIBUTES, ...attributes });
}, { ...Token.DEFAULT_TOKEN_ATTRIBUTES, type: 'message', name: 'message' });

export const $map = Utils.attributableMethod((attributes, _pattern, mapMethod) => {
  return Utils.attributableMethod((attributes, context) => {
    let [ pattern ] = collectPatterns([ _pattern ]);
    let token       = pattern(context);

    if (attributes.successOnly === true && !token)
      return token;

    let finalResult = mapMethod({ context, attributes, token });
    if (finalResult === undefined)
      finalResult = token;

    return finalResult;
  }, { ...Token.DEFAULT_TOKEN_ATTRIBUTES, ...attributes });
}, { ...Token.DEFAULT_TOKEN_ATTRIBUTES, successOnly: false });

export const $context = Utils.attributableMethod((attributes, storage, _pattern) => {
  return Utils.attributableMethod((attributes, _context) => {
    let [ pattern ] = collectPatterns([ _pattern ]);
    let context     = _context.clone({ ...attributes, storage });

    return pattern(context);
  }, { ...Token.DEFAULT_TOKEN_ATTRIBUTES, ...attributes });
}, Token.DEFAULT_TOKEN_ATTRIBUTES);
