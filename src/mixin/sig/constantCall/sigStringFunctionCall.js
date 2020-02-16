module.exports = {
  "type": "CallExpression",
  "callee": {
    "type": "MemberExpression",
    "object": {
      "type": "Identifier",
      "name": "String"
    },
    "property": {
      "type": "Identifier",
      "name": {
        $sig: {
          name: 'method',
          $or: [
            "fromCharCode",
            "fromCodePoint"
          ]
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
