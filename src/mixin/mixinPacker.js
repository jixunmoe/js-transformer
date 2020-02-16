const sigEvalPacker = require('./sig/packer/sigEvalPacker');

const B = require('../utils/builder');
const {sigMatch} = require('../sigMatch/SigMatch');

function mixinPacker(transformer) {
  transformer.mixin(mixinPacker);
}

mixinPacker.setup = function (transformer) {
  transformer.hook('CallExpression', transformPacker);
};

const table = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function toBase62(value) {
  let result = '';

  value = value | 0;

  do {
    result = table[value % 62] + result;
    value = value / 62 | 0;
  } while(value > 0);

  return result;
}

function decodePacker(code, words) {
  // p,a,c,k,e,d: always using string as id mapper
  // p,a,c,k,e,r: base62
  const mapper = new RegExp(`\\w${toBase62(words.length) - 1}\\w`).test(code) ? toBase62 : String;

  return code.replace(/\b\w+\b/g, z => {
    const key = mapper(z);
    return words[key] || key;
  });
}

function transformPacker(ctx, block) {
  const result = {};
  if (sigMatch(block, sigEvalPacker, result)) {
    let {p, a, c, k, e, splitter} = result;
    [p, a, c, k, e, splitter] = [p, a, c, k, e, splitter].map(x => x.match);
    const decoded = decodePacker(p, k.split(splitter));
    return B.callExpression(B.identifier('eval'), [B.literal(decoded)]);
  }

  return block;
}


Object.assign(mixinPacker, {
  transformPacker,
});


module.exports = mixinPacker;
