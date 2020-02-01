const { isObject } = require('./checks');

// Object partial match;
// Array needs to be deep equal.
function sigMatch(toCheck, toMatch) {
  if (toCheck === toMatch) {
    return true;
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

module.exports = sigMatch;
