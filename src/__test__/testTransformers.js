// Example test cases structure:
// const testCases = new Map([
//     ['transformArrayConstructorCallToFunction', [{
//         name: 'ignore expression constructor call',
//         source: `[].filter.constructor("a" + "b")`,
//         expected: `[].filter.constructor("a" + "b")`
//     }, {
//         name: "turn filter constructor call to function expression",
//         source: `[].filter.constructor("return location")`,
//         expected: `function() { return location }`
//     }, {
//         name: "turn filter constructor call to function expression return complex items",
//         source: `[].filter.constructor("return new Date(2011)")`,
//         expected: `function() { return new Date(2011) }`
//     }]],
//     ['transformIifeReturnExpression', [{
//         name: "iife to the item returned",
//         source: `(function () { return 2020 })()`,
//         expected: `2020`
//     }]]
// ]);

const recast = require('recast');
const AstTransformer = require('../AstTransformer');

const toCode = block => recast.print(block).code.replace(/\s+/g, ' ');
const toExpression = code => recast.parse(code).program.body[0].expression;

function testTransformers(t, mixin, testCases) {
  for (const [transformer, transformCases] of testCases.entries()) {
    for (const {name, source, expected} of transformCases) {
      const ctx = new AstTransformer('');
      ctx.mixin(mixin);
      const code = toExpression(source);
      t.equals(
        toCode(mixin[transformer](ctx, code)),
        expected,
        name
      );
    }
  }
}

module.exports = testTransformers;
