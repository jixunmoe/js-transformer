const deref = fn => Function.prototype.call.bind(fn);
const owns = deref(Object.prototype.hasOwnProperty);

function getBlockType (block) {
  return block && block.type;
}

function isLiteral (block) {
  return getBlockType(block) === 'Literal';
}

function isSafeString (str) {
  return typeof str === 'string' && !/^\d/.test(str) && `"${str}"` === JSON.stringify(str);
}

function isObject(value) {
  return value && typeof value === 'object';
}

function shallowEqual(a, b) {
  if (a === b) {
    return true;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }

  if (isObject(a) && isObject(b)) {
    const keyA = Object.keys(a);
    const keyB = Object.keys(b);
    const keys = new Set([...keyA, ...keyB]);
    if (keys.size === keyA.length && keys.size === keyB.length) {
      for(const key of keys.entries()) {
        if (a[key] !== b[key]) {
          return false;
        }
      }
      return true;
    }
  }

  return false;
}

function isFunction(f) {
  return f instanceof Function;
}

module.exports = {
  owns,

  isObject,
  isLiteral,
  isFunction,
  shallowEqual,
  isSafeString,
  getBlockType,
};
