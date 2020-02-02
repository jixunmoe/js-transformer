const test = require('tape');

const mixinSimple = require('../mixinSimple');
const testTransformers = require('./testTransformers');

test('mixinSimple#transformers', t => {
  testTransformers(t, mixinSimple, __filename);
  t.end();
});
