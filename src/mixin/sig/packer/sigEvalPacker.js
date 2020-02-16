module.exports = {
  "type": "CallExpression",
  "callee": {
    "type": "Identifier",
    "name": "eval"
  },
  "arguments": [
    {
      "type": "CallExpression",
      "callee": {
        "type": "FunctionExpression",
        "id": null,
        "params": [
          { "type": "Identifier" },
          { "type": "Identifier" },
          { "type": "Identifier" },
          { "type": "Identifier" },
          { "type": "Identifier" },
          { "type": "Identifier" }
        ],
        "generator": false,
        "async": false
      },
      "arguments": [
        {
          "type": "Literal",
          value: { $sig: { name: 'p' } }
        },
        {
          "type": "Literal",
          value: { $sig: { name: 'a' } }
        },
        {
          "type": "Literal",
          value: { $sig: { name: 'c' } }
        },
        {
          "type": "CallExpression",
          "callee": {
            "type": "MemberExpression",
            "computed": false,
            "object": {
              "type": "Literal",
              value: { $sig: { name: 'k' } }
            },
            "property": {
              "type": "Identifier",
              "name": "split"
            }
          },
          "arguments": [
            {
              "type": "Literal",
              value: { $sig: { name: 'splitter' } }
            }
          ]
        },
        {
          "type": "Literal",
          value: { $sig: { name: 'e' } }
        },
        {
          "type": "ObjectExpression",
          "properties": []
        }
      ]
    }
  ]
};
