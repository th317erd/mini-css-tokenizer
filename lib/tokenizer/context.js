import * as Utils from '../utils.js';

export class Context {
  static fromSource(sourceString) {
    return new Context({
      content:  sourceString,
      start:    0,
      end:      sourceString.length,
    });
  }

  constructor(options) {
    Object.assign(this, options || {});
  }

  clone(_options) {
    let options = _options || {};

    return new this.constructor(
      Object.assign(
        Object.create(null),
        {
          ...this,
          ...options,
          storage: Object.assign(
            Object.create(null),
            {
              ...(this.storage || {}),
              ...(options.storage || {}),
            },
          ),
        },
      ),
    );
  }

  fetch(path, defaultValue) {
    if (!this.storage)
      return defaultValue;

    return Utils.fetch.call(this.storage, path, defaultValue);
  }
}
