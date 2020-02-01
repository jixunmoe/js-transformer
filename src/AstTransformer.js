const recast = require("recast");

const {
  getBlockType,
  shallowEqual,
} = require('./utils/checks');

const castToLiteral = require('./utils/castToLiteral');

const Transformer = require('./Transformer');

class AstTransformer extends Transformer {
  constructor(input) {
    super();

    this.ast = recast.parse(input);
    this.hook('castToLiteral', castToLiteral);
  }

  async transform() {
    this.ast.program = await this.walk(this.ast.program, this.transformBlock);
  }

  /**
   * Walk through the block.
   * @param {Object} block to transform
   * @param {Function} transformBlockFn
   * @returns {Promise<Object>} Transformed block
   */
  walk(block, transformBlockFn) {
    let changed = 1;

    while(changed) {
      changed = 0;

      const lastBlock = block;
      block = transformBlockFn(this, block);
      changed |= !shallowEqual(lastBlock, block);
      if (changed) {
        continue;
      }

      if (block) {
        for (const key in block) {
          if (block.hasOwnProperty(key) && !AstTransformer.ignoreKey.includes(key)) {
            const val = block[key];

            if (Array.isArray(val)) {
              const newVal = Array.from(block[key], v => this.walk(v, transformBlockFn));
              changed |= !shallowEqual(val, newVal);
              block[key] = newVal;
            } else if (val && val.type) {
              const newVal = this.walk(val, transformBlockFn);
              changed |= !shallowEqual(val, newVal);
              block[key] = newVal;
            }
          }
        }
      }
    }

    return block;
  };

  getCode() {
    return recast.prettyPrint(this.ast).code;
  }

  getPropertyName = (block) => {
    if (getBlockType(block.property) === 'Identifier') {
      return [true, block.property.name];
    }

    return this.castToLiteral(block.property);
  };

  castToLiteral = (block) => {
    const casters = this.getHooks('castToLiteral');
    for (const caster of casters) {
      const result = caster(this, block);
      if (result[0]) {
        return result;
      }
    }

    return [false];
  };

  castAllToLiteral(blocks) {
    const results = Array.from(blocks, this.castToLiteral);
    if (results.every(v => v[0])) {
      return results.map(v => v[1]);
    }
    return null;
  };
}
AstTransformer.ignoreKey = ['loc', 'type', 'comments'];

module.exports = AstTransformer;
