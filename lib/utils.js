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

export function attributableMethod(method, _defaultAttributes) {
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
  return bindMethodAttributes(method, defaultAttributes);
}
