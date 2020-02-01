const recast = require("recast");
const B = recast.types.builders;

function codeToBlocks(code) {
  return recast.parse(code).program.body;
}

function createConstant(value) {
  if (value === undefined) {
    return B.identifier('undefined');
  }

  return B.literal(value);
}

/**
 * Create iife expression from given string.
 * @param {String} code String
 * @param {String[]} params param names
 * @param {Object[]} args Arguments passed in.
 */
function createIifeFromString(code, params = [], args = []) {
  return B.expressionStatement(B.callExpression(B.functionExpression(null, params, B.blockStatement(codeToBlocks(code))), args));
}

/**
 * Create function from given string.
 * @param {Object[]} args Arguments passed in.
 * @param {String} body Function body.
 */
function createFunctionFromString(args, body) {
  return B.functionExpression(null, args, B.blockStatement(codeToBlocks(body)));
}

module.exports = {
  ...B,
  createConstant,
  createIifeFromString,
  createFunctionFromString,
};
