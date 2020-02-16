const test = require('tape');
const fs = require('fs');

const testTransformers = require('./testTransformers');
const mixinConstantCall = require('../mixinConstantCall');

test('mixinConstantCall#transformers', t => {
  testTransformers(t, mixinConstantCall, __filename);
  t.end();
});
