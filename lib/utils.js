export function cloneRegExp(regexp, _forceFlags, _disallowFlags) {
  let forceFlags    = _forceFlags;
  let disallowFlags = _disallowFlags;

  if (typeof forceFlags === 'string' || forceFlags instanceof String)
    forceFlags = ('' + forceFlags).toLowerCase().split('');

  if (typeof disallowFlags === 'string' || disallowFlags instanceof String)
    disallowFlags = ('' + disallowFlags).toLowerCase().split('');

  const getFlags = (_flags) => {
    let flags = (_flags || '').split('').map((p) => p.toLowerCase());

    if (disallowFlags && disallowFlags.length > 0)
      flags = flags.filter((flag) => (disallowFlags.indexOf(flag) < 0));

    if (forceFlags && forceFlags.length > 0) {
      for (let i = 0, il = forceFlags.length; i < il; i++) {
        let forceFlag = forceFlags[i];
        if (flags.indexOf(forceFlag) < 0)
          flags.push(forceFlag);
      }
    }

    return flags.sort().join('');
  };

  let flags = getFlags(regexp.flags);
  return new RegExp(regexp.source, flags);
}

export const ATTRIBUTABLE_METHOD = Symbol.for('/mini-css-tokenizer/attributable');

export function attributableMethod(method, _defaultAttributes, _scopeOverride) {
  let defaultAttributes = _defaultAttributes || {};
  let attributeNames    = Object.keys(defaultAttributes);

  const bindMethodAttributes = (method, scope) => {
    let boundMethod = method.bind(this, scope);

    attributeNames.forEach((attributeName) => {
      Object.defineProperty(boundMethod, attributeName, {
        writable:     false,
        enumerable:   false,
        configurable: false,
        value:        function(_value) {
          let value = _value;
          if (arguments.length === 0)
            value = true;

          let newScope = {
            ...scope,
            [attributeName]: value,
          };

          return bindMethodAttributes(method, newScope);
        },
      });
    });

    Object.defineProperty(boundMethod, ATTRIBUTABLE_METHOD, {
      writable:     false,
      enumerable:   false,
      configurable: false,
      value:        true,
    });

    Object.defineProperty(boundMethod, 'getAttribute', {
      writable:     false,
      enumerable:   false,
      configurable: false,
      value:        function(attributeName) {
        return scope[attributeName];
      },
    });

    Object.defineProperty(boundMethod, 'setAttribute', {
      writable:     false,
      enumerable:   false,
      configurable: false,
      value:        function(attributeName, _value) {
        if (arguments.length < 1)
          bindMethodAttributes(method, scope);

        let value = _value;
        if (arguments.length === 1)
          value = true;

        let newScope = {
          ...scope,
          [attributeName]: value,
        };

        return bindMethodAttributes(method, newScope);
      },
    });

    Object.defineProperty(boundMethod, 'setAttributes', {
      writable:     false,
      enumerable:   false,
      configurable: false,
      value:        function(attributes) {
        let newScope = {
          ...scope,
          ...(attributes || {}),
        };

        return bindMethodAttributes(method, newScope);
      },
    });

    return boundMethod;
  };

  // Default method
  return bindMethodAttributes(method, _scopeOverride || defaultAttributes);
}

export function isPlainObject(value) {
  if (!value)
    return false;

  if (typeof value !== 'object')
    return false;

  if (value.constructor === Object || value.constructor == null)
    return true;

  return false;
}

const SAFE_ARRAY_ACCESS = (/^(\d+|length)$/);

export function fetch(path, defaultValue) {
  if (!this)
    return defaultValue;

  let pathParts = (Array.isArray(path)) ? path : ((path && typeof path.split === 'function' && path.split('.')) || []);
  let key       = pathParts.shift();
  if (key == null)
    return defaultValue;

  let value;
  if (this !== global && isPlainObject(this) && Object.prototype.hasOwnProperty.call(this, key))
    value = this[key];
  else if (Array.isArray(this) && SAFE_ARRAY_ACCESS.test(key))
    value = this[key];
  else if (typeof this === 'function' && key === 'name')
    value = this.name;
  else if (typeof this.get === 'function')
    value = this.get(key);
  else if (this !== global && Object.prototype.hasOwnProperty.call(this, key) && !(key in Object.prototype))
    value = this[key];

  if (value == null)
    return defaultValue;

  if (pathParts.length === 0)
    return value;

  return fetch.call(value, pathParts, defaultValue);
}
