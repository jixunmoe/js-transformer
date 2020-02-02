const {
  isObject,
} = require('../utils/checks');

/**
 * Extract $sig block.
 * @param block
 * @returns {SigContent|false}
 */
function getSigBlock(block) {
  return isObject(block) && block.$sig;
}

module.exports = {
  getSigBlock,
};
