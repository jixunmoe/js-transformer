module.exports = {
  "type": "ExpressionStatement",
  "expression": {
    "type": "CallExpression",
    "callee": {
      "type": "Identifier",
      "name": "eval"
    },
    "arguments": [
      {
        "type": "Literal",
        "value": {
          $sig: {
            name: 'code',
          }
        }
      }
    ]
  }
};
