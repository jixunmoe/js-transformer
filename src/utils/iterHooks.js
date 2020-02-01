const iterReverse = require('./iterReverse');

function iterHooks(hooks, ctx, ...args) {
  for(const hook of iterReverse(hooks)) {
    const result = hook.call(ctx, ctx, ...args);
    if (result[0]) {
      return result;
    }
  }

  return [false];
}

module.exports = iterHooks;
