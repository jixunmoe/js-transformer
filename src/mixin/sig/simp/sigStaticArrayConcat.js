// Checks:
// callee.object.elements => static array
// arguments.elements => static array
// merge!

module.exports = {
  "type": "CallExpression",
  "callee": {
    "type": "MemberExpression",
    "computed": false,
    "object": {
      "type": "ArrayExpression",
      // "elements": []
      // callee.object.elements
    },
    "property": {
      "type": "Identifier",
      "name": "concat"
    }
  },
  "arguments": [
    {
      "type": "ArrayExpression",
      // "elements": [
      //   {
      //     "type": "ArrayExpression",
      //     "elements": []
      //   }
      // ]
      // arguments.elements
    }
  ]
};
