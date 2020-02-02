function mixinProps(ctx, functions) {
  for(const key of [...Object.getOwnPropertyNames(functions), ...Object.getOwnPropertySymbols(functions)]) {
    const fn = functions[key];
    Object.defineProperty(ctx, key, {
      value: fn.bind(ctx, ctx),
      enumerable: false,
      configurable: true,
      writable: true,
    });
  }
}

module.exports = mixinProps;
