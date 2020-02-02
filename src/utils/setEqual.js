/**
 * Check if 2 sets are equal
 * @param {Set} a
 * @param {Set} b
 */
function setEqual(a, b) {
  if (a.size !== b.size) {
    return false;
  }

  for (const v of a) {
    if (!b.has(v)) {
      return false;
    }
  }

  return true;
}

module.exports = setEqual;
