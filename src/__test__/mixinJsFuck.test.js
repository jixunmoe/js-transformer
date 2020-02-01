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
    t.equals(transformer.getCode(), expected, name);
  }
});

const testCases = new Map([
  ['transformDateStringGMT', [{
    name: 'NaN + Date => "G"',
    source: `(NaN + Date())["30"]`,
    expected: `"G"`
  }, {
    name: 'true + Date => "M"',
    source: `(true + Date())["30"]`,
    expected: `"M"`
  }, {
    name: 'false + Date => "T"',
    source: `(false + Date())["30"]`,
    expected: `"T"`
  }]],
]);

test('mixinJsFuck#transformers', t => {
  testTransformers(t, mixinJsFuck, testCases);
  t.end();
});
