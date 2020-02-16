const test = require('tape');

const AstTransformer = require('../../AstTransformer');
const mixinSimple = require('../mixinSimple');
const testTransformers = require('./testTransformers');

test('mixinSimple#transformers', t => {
  testTransformers(t, mixinSimple, __filename);
  t.end();
});

test('mixinSimple#expand eval when safe to do so', t => {
  t.plan(1);

  const ast = new AstTransformer(`eval('a = 1'); eval('b = 2');`);
  ast.mixin(mixinSimple);
  ast.transform();
  t.equals(ast.getCode(), 'a = 1;\nb = 2;');
});

test('mixinSimple#do not expand if unsure', t => {
  t.plan(1);

  const ast = new AstTransformer(`b = eval('a = 1');`);
  ast.mixin(mixinSimple);
  ast.transform();
  t.equals(ast.getCode(), 'b = eval("a = 1");');
});
