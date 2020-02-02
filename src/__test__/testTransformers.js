const fs = require('fs');
const yaml = require('js-yaml');
const recast = require('recast');
const AstTransformer = require('../AstTransformer');

const toCode = block => recast.print(block).code.replace(/\s+/g, ' ');
const toExpression = code => recast.parse(code).program.body[0].expression;

function testTransformers(t, mixin, file) {
  const content = fs.readFileSync(file.replace(/\.js$/, '.yaml'), 'utf-8');
  const testCases = new Map(yaml.safeLoad(content));

  for (const [transformer, transformCases] of testCases.entries()) {
    for (const {name, source, expected} of transformCases) {
      const ctx = new AstTransformer('');
      ctx.mixin(mixin);
      const code = toExpression(source);
      t.equals(
        toCode(mixin[transformer](ctx, code)).replace(/\r/g, ''),
        expected.replace(/\r/g, ''),
        name
      );
    }
  }
}

module.exports = testTransformers;
