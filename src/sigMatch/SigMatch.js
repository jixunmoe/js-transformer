const { isObject } = require('../utils/checks');

class SigMatch {
  static sigMatch(toCheck, toMatch, results, parent = null) {
    // Object partial match;
    // Array needs to be deep equal.
    if (toCheck === toMatch) {
      return true;
    }

    if (toMatch && toMatch.$sig) {
      return SigMatch.matchSigBlock(toCheck, toMatch.$sig, results, parent);
    }

    if (Array.isArray(toCheck) && Array.isArray(toMatch)) {
      return SigMatch.matchArray(toCheck, toMatch, results);
    }

    if (isObject(toCheck) && isObject(toMatch)) {
      return SigMatch.matchObject(toCheck, toMatch, results);
    }

    // The "===" check already failed.
    return false;
  }

  static matchSigBlock(toCheck, sigBlock, results, parent) {
    if (Array.isArray(sigBlock.partialArray)) {
      return SigMatch.matchPartialArray(toCheck, sigBlock, results);
    }

    if (Array.isArray(sigBlock.$or)) {
      return SigMatch.matchOr(toCheck, sigBlock, results, parent);
    }

    if (sigBlock.match) {
      if (SigMatch.sigMatch(toCheck, sigBlock.match, results)) {
        if (sigBlock.name) {
          results[sigBlock.name] = {
            match: toCheck,
            parent: parent,
          };
        }
        return true;
      }
      return false;
    }

    if (sigBlock.name) {
      results[sigBlock.name] = {
        match: toCheck,
        parent: parent,
      };
      return true;
    }

    throw new Error('sigMatch: empty $sig block.');
  }

  static matchOr(toCheck, sigBlock, results, parent) {
    return sigBlock.$or.some(sigItem => SigMatch.sigMatch(toCheck, sigItem, results, parent));
  }

  static matchPartialArray(toCheck, sigBlock, results) {
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
      if (sigArr.every((sigItem, j) => SigMatch.sigMatch(toCheck[i + j], sigItem, results, toCheck))) {
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

  static matchArray(toCheck, toMatch, results) {
    return toCheck.length === toMatch.length &&
      toCheck.every((checkI, i) => SigMatch.sigMatch(checkI, toMatch[i], results, toCheck));
  }

  static matchObject(toCheck, toMatch, results) {
    for(const key of Object.keys(toMatch)) {
      if (toMatch.hasOwnProperty(key)) {
        if (!toCheck.hasOwnProperty(key) || !SigMatch.sigMatch(toCheck[key], toMatch[key], results, toCheck)) {
          return false;
        }
      }
    }
    return true;
  }
}

module.exports = SigMatch;
