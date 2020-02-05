const mixinSimple = require('./mixinSimple');

// JSFuck:      http://www.jsfuck.com/
// Hieroglyphy: http://patriciopalladino.com/files/hieroglyphy/

const sigNewDate = require('./sig/jsfuck/sigNewDate');
const sigLocationChar = require('./sig/jsfuck/sigLocationChar');
const sigGetCharFromDateString = require('./sig/jsfuck/sigGetCharFromDateString');

const B = require('../utils/builder');
const getIn = require('../utils/getIn');
const { sigMatch } = require('../sigMatch/SigMatch');

function mixinJsFuck(transformer) {
  transformer.mixin(mixinJsFuck);
}

mixinJsFuck.setup = function (transformer) {
  transformer.mixin(mixinSimple);

  transformer.hook('castToLiteral', castNewDateToValue);
  transformer.hook('MemberExpression', transformDateStringGMT);
  transformer.hook('MemberExpression', transformFromLocationString);
};

function castNewDateToValue(ctx, block) {
  if (sigMatch(block, sigNewDate)) {
    if (block.arguments.length > 0) {
      const args = ctx.castAllToLiteral(block.arguments);
      if (args) {
        // noinspection JSCheckFunctionSignatures
        return [true, new Date(...args)];
      }
    }
  }

  return [false];
}

const GMTMapping = new Map([
  [true, 'M'],
  [false, 'T'],
]);

function transformDateStringGMT(ctx, block) {
  if (sigMatch(block, sigGetCharFromDateString)) {
    const index = parseInt(getIn(block, 'property.value'));
    if (index === 30) {
      let [ok, lhs] = ctx.castToLiteral(getIn(block, 'object.left'));
      if (Number.isNaN(lhs)) {
        return B.createConstant('G');
      }
      if (ok && GMTMapping.has(lhs)) {
        return B.createConstant(GMTMapping.get(lhs));
      }
    }
  }

  return block;
}

const locationCharMap = new Map([
  [0, 'h'],
  [3, 'p'],
  [6, '/'],
]);

function transformFromLocationString(ctx, block) {
  const results = {};
  if (sigMatch(block, sigLocationChar, results)) {
    const idx = parseInt(results.idx.match, 10);
    if (locationCharMap.has(idx)) {
      return B.createConstant(locationCharMap.get(idx));
    }
  }

  return block;
}

Object.assign(mixinJsFuck, {
  castNewDateToValue,
  transformDateStringGMT,
  transformFromLocationString,
});


module.exports = mixinJsFuck;
