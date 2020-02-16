const sigStringFunctionCall = require('./sig/constantCall/sigStringFunctionCall');
const sigLiteralCall = require('./sig/constantCall/sigLiteralCall');

const B = require('../utils/builder');
const { sigMatch } = require('../sigMatch/SigMatch');

function mixinConstantCall(transformer) {
  transformer.mixin(mixinConstantCall);
}

mixinConstantCall.setup = function (transformer) {
  transformer.hook('CallExpression', castStringFromCharCode);
  transformer.hook('CallExpression', transformLiteralMethodCall);
};

function castStringFromCharCode(ctx, block) {
  const result = {};
  if (sigMatch(block, sigStringFunctionCall, result)) {
    const args = ctx.castAllToLiteral(result.args.match);
    if (args) {
      const value = String[result.method.match](...args);
      return B.createConstant(value);
    }
  }
  return block;
}

const staticLiteralCalls = new Map([
  ['number', new Set([
    'toExponential',
    'toFixed',
    'toPrecision',
    'toString',
  ])],
  ['string', new Set([
    'charAt',
    'charCodeAt',
    'codePointAt',
    'concat',
    'endsWith',
    'includes',
    'indexOf',
    'padEnd',
    'padStart',
    'repeat',
    'slice',
    'split',
    'startsWith',
    'substring',
    // 'toLocaleLowerCase',
    // 'toLocaleUpperCase',
    'toLowerCase',
    'toString',
    'toUpperCase',
    'trim',
    'trimEnd',
    'trimStart',

    // deprecated.
    'fixed',
    'fontcolor',
    'fontsize',
    'italics',
    'link',
    'small',
    'strike',
    'sub',
    'substr',
    'sup',
  ])],
]);

function transformLiteralMethodCall(ctx, block) {
  const results = {};
  if (sigMatch(block, sigLiteralCall, results)) {
    const literal = results.literal.match;
    const type = typeof literal;
    if (staticLiteralCalls.has(type)) {
      const method = results.method.match;
      if (staticLiteralCalls.get(type).has(method)) {
        const args = ctx.castAllToLiteral(results.args.match);
        if (args) {
          const value = literal[method](...args);
          try {
            return B.createConstant(value);
          } catch (e) {
            // ignore ...
          }
        }
      }
    }
  }

  return block;
}

Object.assign(mixinConstantCall, {
  castStringFromCharCode,
  transformLiteralMethodCall,
});

module.exports = mixinConstantCall;
