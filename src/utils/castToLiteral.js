const { getBlockType } = require('./checks');

const idMap = new Map([
  ['undefined', undefined],
  ['NaN', NaN],
]);

/**
 * @param {AstTransformer} ctx
 * @param block
 * @returns {[Boolean, *]}
 */
function castToLiteral(ctx, block) {
  if (Array.isArray(block)) {
    const result = ctx.castAllToLiteral(block);
    return [result, result];
  }

  const type = getBlockType(block);
  if (type) {
    if (type === 'Literal') {
      return [true, block.value];
    }

    if (type === 'ArrayExpression') {
      const elements = ctx.castAllToLiteral(block.elements);
      return [elements, elements];
    }

    if (type === 'ObjectExpression') {
      return [block.properties.length === 0, {}];
    }

    if (type === 'MemberExpression') {
      const [propOk, property] = ctx.getPropertyName(block);
      if (!propOk) {
        return [false];
      }

      if (block.object.type === 'ArrayExpression') {
        if (typeof Array.prototype[property] === 'function') {
          return [true, Array.prototype[property]];
        }
        return [false];
      }

      const [objOk, object] = castToLiteral(ctx, block.object);
      if (objOk) {
        return [true, object[property]];
      }

      return [false];
    }

    if (type === 'Identifier') {
      return [idMap.has(block.name), idMap.get(block.name)];
    }
  }

  return [false];
}

module.exports = castToLiteral;
