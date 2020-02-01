function getIn (obj, access) {
  if (!access || !access.length) return;

  if (typeof access === 'string') {
    access = access.split('.');
  }

  for (const key of access) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      obj = obj[key];
    } else {
      return;
    }
  }

  return obj;
}

module.exports = getIn;
