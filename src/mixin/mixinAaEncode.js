const sigAaEncode = require('./sig/aaencode/sigAaEncode');

const B = require('../utils/builder');
const { sigMatch } = require('../sigMatch/SigMatch');

function mixinAaEncode(transformer) {
  transformer.mixin(mixinAaEncode);
}

mixinAaEncode.setup = function (transformer) {
  transformer.hook('WalkArray', decodeAaEncode);
};

const shockValues = new Map([
  // _: function constructor
  ["1", "f"],
  ["ﾟΘﾟ", "_"],
  ["ﾟωﾟﾉ", "a"],
  ["ﾟｰﾟﾉ", "d"],
  ["ﾟДﾟﾉ", "e"],
  ["c", "c"],
  ["o", "o"],
  ["return", "\\"],
  ["ﾟΘﾟﾉ", "b"],
  ["constructor", '\"']
]);

const globalValues = new Map([
  ["ﾟωﾟﾉ", undefined],
  ["o", 3],
  ["ﾟｰﾟ", 4],
  ["_", 3],
  ["c", 0],
  ["ﾟΘﾟ", 1],
  ["ﾟεﾟ", "return"],
  ["ﾟoﾟ", "constructor"],
  ["oﾟｰﾟo", "u"],
]);

function transformIdentifier(ctx, block) {
  if (block.type === 'Identifier') {
    if (globalValues.has(block.name)) {
      return B.createConstant(globalValues.get(block.name));
    }
  }

  if (block.type === 'MemberExpression') {
    if (block.object.type === 'Identifier' && block.object.name === 'ﾟДﾟ') {
      if (block.property.type === 'Literal') {
        const key = block.property.value;
        if (shockValues.has(key)) {
          return B.createConstant(shockValues.get(key));
        }
      }
    }
  }

  return block;
}

function decodeAaEncode(ctx, block) {
  const result = {};
  if (sigMatch(block, sigAaEncode, result)) {
    const { match: aaEncoderBlock, from, size } = result.wrapper;

    const expression = B.callExpression(
      B.newExpression(B.identifier('Function'), [
        B.callExpression(B.newExpression(B.identifier('Function'), [result.code.match]), [])
      ]),
      []
    );

    ctx.walk(expression, transformIdentifier);

    aaEncoderBlock.splice(from, size, B.expressionStatement(expression));
    return [true, aaEncoderBlock];
  }

  return [false];
}

Object.assign(mixinAaEncode, {
  decodeAaEncode,
});


module.exports = mixinAaEncode;
