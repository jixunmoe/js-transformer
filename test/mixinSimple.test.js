const test = require('tape');

const mixinSimple = require('../src/mixinSimple');
const testTransformers = require('./testTransformers');

const testCases = new Map([
  ['transformArrayConstructorCallToFunction', [{
    name: 'ignore expression constructor call',
    source: `[].filter.constructor("a" + "b")`,
    expected: `[].filter.constructor("a" + "b")`
  }, {
    name: "turn filter constructor call to function expression",
    source: `[].filter.constructor("return location")`,
    expected: `function() { return location }`
  }, {
    name: "turn filter constructor call to function expression return complex items",
    source: `[].filter.constructor("return new Date(2011)")`,
    expected: `function() { return new Date(2011) }`
  }]],
]);

test('mixinSimple#transformers', t => {
  testTransformers(mixinSimple, testCases);
  t.end();
});
