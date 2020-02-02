const test = require('tape');
const fs = require('fs');

const testTransformers = require('./testTransformers');
const AstTransformer = require('../AstTransformer');
const mixinJsFuck = require('../mixinJsFuck');

test('jsfuck', async t => {
  const cases = [
    {name: 'simple case', file: '1'}
  ];
  t.plan(cases.length);

  const file = f => fs.readFileSync(__dirname + '/__fixture__/jsfuck/' + f + '.js', 'utf-8');
  const load = f => [file(f), file(f + '.expect')];
  for (const {name, file} of cases) {
    const [input, expected] = load(file);
    const transformer = new AstTransformer(input);
    transformer.mixin(mixinJsFuck);
    await transformer.transform();
    t.equals(transformer.getCode().replace(/\r/g, ''), expected.replace(/\r/g, ''), name);
  }
});

test('mixinJsFuck#transformers', t => {
  testTransformers(t, mixinJsFuck, __filename);
  t.end();
});
