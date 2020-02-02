const test = require('tape');

const testWithScriptFixture = require('./testWithScriptFixture');

const AstTransformer = require('../../AstTransformer');
const mixinAaEncode = require('../mixinAaEncode');
const mixinSimple = require('../mixinSimple');

const cases = [{
  name: 'default case',
  file: 'default',
}];

test('aaencode', t => {
  testWithScriptFixture(t, 'aaencode', cases, input => {
    const transformer = new AstTransformer(input);
    transformer.mixin(mixinSimple, mixinAaEncode);
    transformer.transform();
    return transformer.getCode(2);
  });

  t.end();
});

