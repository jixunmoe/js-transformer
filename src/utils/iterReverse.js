function* iterReverse(value) {
  if (value instanceof Set) {
    value = Array.from(value);
  }

  let i = value.length;

  while(i --> 0) {
    yield value[i];
  }
}

module.exports = iterReverse;
