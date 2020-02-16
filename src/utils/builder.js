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
  // const result = B.literal(value);
  // if (typeof result.value === 'string') {
  //   result.raw = result.raw.replace(/[\u2000-\u201f]/g, z => '\\u' + z.charCodeAt(0).toString(16));
  // }
  // return result;
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

function addComment(block, comment) {
  if (block.comments) {
    block.comments.push(comment);
  } else {
    block.comments = [comment];
  }
}

module.exports = {
  ...B,
  addComment,
  codeToBlocks,
  createConstant,
  createIifeFromString,
  createFunctionFromString,
};
