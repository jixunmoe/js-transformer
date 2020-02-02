const { isObject } = require('../utils/checks');
const { getSigBlock } = require('./helper');

// Object partial match;
// Array needs to be deep equal.
function sigMatch(toCheck, toMatch, results) {
  if (toCheck === toMatch) {
    return true;
  }

  const sigBlock = getSigBlock(toMatch);
  if (sigBlock) {
    if (Array.isArray(sigBlock.partialArray)) {
      if (matchPartialArray(toCheck, sigBlock, results)) {
        return true;
      }
    } else if (Array.isArray(sigBlock.$or)) {
      return sigBlock.$or.some(sigItem => sigMatch(toCheck, sigItem, results));
    } else if (sigBlock.name) {
      results[sigBlock.name] = toCheck;
      return true;
    }

    throw new Error('sigMatch: empty $sig block.');
  }

  if (Array.isArray(toCheck) && Array.isArray(toMatch)) {
    return toCheck.length === toMatch.length &&
      toCheck.every((checkI, i) => sigMatch(checkI, toMatch[i]));
  }

  if (isObject(toCheck) && isObject(toMatch)) {
    for(const key of Object.keys(toMatch)) {
      if (toMatch.hasOwnProperty(key)) {
        if (!toCheck.hasOwnProperty(key) || !sigMatch(toCheck[key], toMatch[key])) {
          return false;
        }
      }
    }
    return true;
  }

  // The "===" check already failed.
  return false;
}

function matchPartialArray(toCheck, sigBlock, results) {
  if (!Array.isArray(toCheck)) {
    return false;
  }

  const toCheckLen = toCheck.length;
  const sigArr = sigBlock.partialArray;
  const sigLen = sigArr.length;
  const iter = toCheckLen - sigLen;
  if (iter < 0) {
    return false;
  }

  for(let i = 0; i <= iter; i++) {
    if (sigArr.every((sigItem, j) => sigMatch(toCheck[i + j], sigItem, results))) {
      if (sigBlock.name) {
        results[sigBlock.name] = {
          match: toCheck,
          from: i,
          size: sigLen,
        };
      }
      return true;
    }
  }

  return false;
}

Object.assign(sigMatch, {
  matchPartialArray,
});

module.exports = sigMatch;
