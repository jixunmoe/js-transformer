const recast = require("recast");

const {
  getBlockType,
  shallowEqual,
} = require('./utils/checks');

const castToLiteral = require('./utils/castToLiteral');
const iterHooks = require('./utils/iterHooks');

const Transformer = require('./Transformer');

class AstTransformer extends Transformer {
  constructor(input) {
    super();

    this.ast = recast.parse(input);
    this.hook('castToLiteral', castToLiteral);
    this.hook('WalkArray', Transformer.noopHook);
  }

  transform() {
    this.ast.program = this.walk(this.ast.program, this.transformBlock);
  }

  // FIXME: Nested update will not trigger parent to re-run the rule...
  /**
   * Walk through the block.
   * @param {Object} block to transform
   * @param {Function} transformBlockFn
   * @returns {Promise<Object>} Transformed block
   */
  walk(block, transformBlockFn) {
    let changed = 1;

    while (changed) {
      changed = 0;

      if (block instanceof Transformer) {
        throw new Error('ctx passed in to walk.');
      }

      const lastBlock = block;
      block = transformBlockFn(this, block);
      changed |= !shallowEqual(lastBlock, block);
      if (changed) {
        continue;
      }

      if (block) {
        for (const key in block) {
          if (block.hasOwnProperty(key) && !AstTransformer.ignoreKey.includes(key)) {
            let val = block[key];

            if (Array.isArray(val)) {
              while (true) {
                const [arrConverted, array] = this.iterHooks('WalkArray', val);
                if (arrConverted) {
                  val = array;
                } else {
                  break;
                }
              }

              const newVal = Array.from(val, v => this.walk(v, transformBlockFn));
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

  getCode(tabWidth = 4) {
    return recast.prettyPrint(this.ast, {
      tabWidth,
    }).code.replace(/\r/g, '');
  }

  getPropertyName = (block) => {
    if (getBlockType(block.property) === 'Identifier') {
      return [true, block.property.name];
    }

    return this.castToLiteral(block.property);
  };

  iterHooks = (type, ...args) => iterHooks(this.getHooks(type), this, ...args);
  castToLiteral = block => this.iterHooks('castToLiteral', block);

  castAllToLiteral(blocks) {
    const results = Array.from(blocks, this.castToLiteral);
    if (results.every(v => v[0])) {
      return results.map(v => v[1]);
    }
    return null;
  };
}

AstTransformer.ignoreKey = ['loc', 'type', 'comments', 'original'];

module.exports = AstTransformer;
