const test = require('tape');
const fs = require('fs');

const AstTransformer = require('../AstTransformer');
const mixinScope = require('../mixinScope');

test('scope mixin', async t => {
  const cases = [
    {name: 'simple case', file: 'simple-case'},
    {name: 'simple scope', file: 'scope-1'},
    {name: 'simple scope with iife', file: 'scope-iife'},
  ];
  t.plan(cases.length);

  const file = f => fs.readFileSync(__dirname + '/__fixture__/scope/' + f + '.js', 'utf-8');
  const load = f => [file(f), file(f + '.expect')];
  for (const {name, file} of cases) {
    const [input, expected] = load(file);
    const transformer = new AstTransformer(input);
    transformer.mixin(mixinScope);
    transformer.scopedTransform(1);
    t.equals(transformer.getCode(2), expected.trim(), name);
  }
});
