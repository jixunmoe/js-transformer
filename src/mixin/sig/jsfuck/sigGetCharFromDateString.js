module.exports = {
  "type": "MemberExpression",
  "computed": true,
  "object": {
    "type": "BinaryExpression",
    "operator": "+",
    "left": {
      // "type": "Identifier",
      // can be: [Identifier: "NaN"] or [Literal: "true", "false"]
      // object.left.name
      // "name": "NaN"
    },
    "right": {
      "type": "CallExpression",
      "callee": {
        "type": "Identifier",
        "name": "Date"
      },
      "arguments": []
    }
  },
  "property": {
    "type": "Literal",
    // "value": "30"
    // property.value
    // needs to be able to cast to 30.
  }
};
