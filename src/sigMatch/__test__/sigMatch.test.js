const test = require('tape');
const SigMatch = require('../SigMatch');

test('SigMatch without $sig', t => {
  t.true(SigMatch.sigMatch({
    a: 1,
  }, {
    a: 1,
  }), 'basic object match');

  t.true(SigMatch.sigMatch({
    a: 1,
    b: 9,
  }, {
    a: 1,
  }), 'basic object match with missing fields');

  t.true(SigMatch.sigMatch([
    1, 2, 3
  ], [
    1, 2, 3
  ]), 'basic array match');

  t.false(SigMatch.sigMatch([
    1, 2, 3
  ], [
    1, 2
  ]), 'disallow array match with missing items');

  t.true(SigMatch.sigMatch({
    a: {
      b: 1,
      c: [5],
    },
  }, {
    a: {
      c: [5]
    },
  }), 'nested object/array match');

  t.end();
});

const sigMatches = [{
  name: 'literal values',
  success: true,
  object: 'hello',
  match: 'hello',
  results: { },
}, {
  name: 'mismatched type',
  success: false,
  object: 'hello',
  match: 333,
  results: { },
}, {
  name: 'sig extract',
  success: true,
  object: {
    a: 1,
  },
  match: {
    $sig: {
      name: 'a',
    }
  },
  results: {
    a: {
      match: {
        a: 1
      },
      parent: null,
    }
  },
}, {
  name: '$or match',
  success: true,
  object: {
    b: 2,
  },
  match: {
    $sig: {
      name: 'result',
      $or: [
        {b: 2},
        {a: 1},
      ]
    }
  },
  results: {
    result: {
      match: { b: 2 },
      parent: null,
    }
  },
}, {
  name: '$or without a match',
  success: false,
  object: {
    c: 3,
  },
  match: {
    $sig: {
      name: 'unused',
      $or: [
        {b: 2},
        {a: 1},
      ]
    }
  },
  results: { },
}, {
  name: 'nested $or match',
  success: true,
  object: {
    b: {
      c: 1,
    },
  },
  match: {
    $sig: {
      name: 'root',
      $or: [
        {a: 1},
        {
          b: {
            $sig: {
              name: 'match_b'
            }
          }
        },
      ]
    }
  },
  results: {
    root: { match: { b: { c: 1 } }, parent: null },
    match_b: {
      match: {
        c: 1
      },
      parent: {
        b: {
          c: 1
        }
      }
    },
  },
}, {
  name: 'partialArray',
  success: true,
  object: [
    1, 2, 3, 4, 5
  ],
  match: {
    $sig: {
      name: 'arr',
      partialArray: [
        2, 3, 4,
      ]
    }
  },
  results: {
    arr: {
      match: [1, 2, 3, 4, 5],
      from: 1,
      size: 3,
    }
  },
}, {
  name: 'partialArray without name',
  success: true,
  object: [
    1, 2, 3, 4, 5
  ],
  match: {
    $sig: {
      partialArray: [
        2, 3, 4,
      ]
    }
  },
  results: {},
}, {
  name: 'not match partialArray with gap',
  success: false,
  object: [
    1, 2, 3, 4, 5
  ],
  match: {
    $sig: {
      name: 'arr',
      partialArray: [
        2, 4,
      ]
    }
  },
  results: {},
}];

test('SigMatch with $sig', t => {
  sigMatches.forEach(({name, object, match, success, results}) => {
    const actualResult = {};
    t.equal(SigMatch.sigMatch(object, match, actualResult), success, 'test: ' + name);
    if (success) {
      t.deepEqual(actualResult, results, 'result: ' + name);
    }
  });

  t.end();
});
