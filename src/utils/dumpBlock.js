const {
  isObject,
} = require('./checks');

function dumpBlock(block) {
  if (Array.isArray(block)) {
    return Array.from(block, dumpBlock);
  }

  if (isObject(block)) {
    const {loc, raw, comments, ...clean} = block;
    Object.keys(clean).forEach(key => {
      clean[key] = dumpBlock(clean[key]);
    });
    return clean;
  }

  return block;
}

module.exports = dumpBlock;
