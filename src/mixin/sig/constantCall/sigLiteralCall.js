module.exports = {
  "type": "CallExpression",
  "callee": {
    "type": "MemberExpression",
    "object": {
      "type": "Literal",
      "value": {
        $sig: {
          name: 'literal'
        }
      }
    },
    "property": {
      "type": "Identifier",
      "name": {
        $sig: {
          name: 'method'
        }
      }
    }
  },
  "arguments": {
    $sig: {
      name: 'args'
    }
  }
};
