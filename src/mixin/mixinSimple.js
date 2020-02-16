const { sigMatch } = require('../sigMatch/SigMatch');

const {
  isLiteral,
  isFunction,
  isSafeString,
  getBlockType,
} = require('../utils/checks');

const B = require('../utils/builder');
const getIn = require('../utils/getIn');

const sigIifeReturn = require('./sig/simp/sigIifeReturn');
const sigNewFunction = require('./sig/simp/sigNewFunction');
const sigGlobalFnCall = require('./sig/simp/sigGlobalFnCall');
const sigEvalStatements = require('./sig/simp/sigEvalStatements');
const sigLitToStringCall = require('./sig/simp/sigLitToStringCall');
const sigStaticArrayConcat = require('./sig/simp/sigStaticArrayConcat');
const sigArrayConstructorCallToFunction = require('./sig/simp/sigArrayConstructorCallToFunction');

/**
 * Create OpCode Cache Object.
 * @param {String} params Parameters
 * @param {Function} fn callback to generate the function body.
 */
const opCache = (params, fn) => new Proxy({}, {
  get: (target, prop) => target[prop] || (target[prop] = new Function(...params, fn(prop))),
});

function mixinSimple(transformer) {
  transformer.mixin(mixinSimple);
}

mixinSimple.setup = function (transformer) {
  transformer.hook('NewExpression', transformNewFunctionToFunction);
  transformer.hook('MemberExpression', transformStringAccessToDotAccess);
  transformer.hook('MemberExpression', transformConstantIndexAccessToConstant);
  transformer.hook('CallExpression', transformLitToStringCall);
  transformer.hook('CallExpression', transformAllowedSandboxFunctionCall);
  transformer.hook('CallExpression', transformArrayConstructorCallToFunction);
  transformer.hook('CallExpression', transformIifeReturnExpression);
  transformer.hook("CallExpression", transformStaticConcatExpression);
  transformer.hook("BinaryExpression", transform2OpExp);
  transformer.hook("LogicalExpression", transform2OpExp);
  transformer.hook("UnaryExpression", transform1OpExp);
  transformer.hook("UpdateExpression", transform1OpExp);

  transformer.hook('WalkArray', expandEvalString);
};

function transformStaticConcatExpression(ctx, block) {
  if (sigMatch(block, sigStaticArrayConcat)) {
    const srcElements = getIn(block, 'callee.object.elements');
    const srcArray = ctx.castAllToLiteral(srcElements);
    if (srcArray) {
      const dstElements = getIn(block, 'arguments.0.elements');
      const dstArray = ctx.castAllToLiteral(dstElements);

      if (dstArray) {
        return B.arrayExpression([...srcElements, ...dstElements]);
      }
    }
  }

  return block;
}

const allowedSandboxFunction = new Map([
  ['escape', escape],
  ['unescape', unescape],
  ['encodeURI', encodeURI],
  ['decodeURI', decodeURI],
  ['encodeURIComponent', encodeURIComponent],
  ['decodeURIComponent', decodeURIComponent],
  ['parseInt', parseInt],
]);

function transformAllowedSandboxFunctionCall(ctx, block) {
  const result = {};
  if (sigMatch(block, sigGlobalFnCall, result)) {
    const fnName = result.name.match;

    if (allowedSandboxFunction.has(fnName)) {
      const args = ctx.castAllToLiteral(result.args.match);
      if (args) {
        const value = allowedSandboxFunction.get(fnName).apply(null, args);
        try {
          return B.createConstant(value);
        } catch (e) {
          // pass
        }
      }
    }
  }

  // TODO: Refactor this...
  if (getBlockType(block.callee) === 'MemberExpression') {
    // See if we can ask castToLiteral to get the function...
    const [objOk, obj] = ctx.castToLiteral(block.callee.object);
    const [propOk, prop] = ctx.getPropertyName(block.callee);
    if (objOk && propOk && isFunction(obj[prop])) {
      const [ok, args] = ctx.castToLiteral(block.arguments);
      if (ok) {
        const result = obj[prop].apply(obj, args);
        try {
          return B.createConstant(result);
        } catch (err) {
          // pass
        }
      }
    }
  }

  return block;
}

function transformLitToStringCall(ctx, block) {
  if (sigMatch(block, sigLitToStringCall)) {
    const lits = ctx.castAllToLiteral([block.callee.object, block.arguments]);
    if (lits) {
      const [obj, args] = lits;
      const value = obj.toString(...args);
      try {
        return B.createConstant(value);
      } catch (error) {
        // pass
      }
    }
  }

  return block;
}

function transformIifeReturnExpression(ctx, block) {
  if (sigMatch(block, sigIifeReturn)) {
    return getIn(block, 'callee.body.body.0.argument');
  }

  return block;
}

// sigNewFunction
function transformNewFunctionToFunction(ctx, block) {
  const results = {};
  if (sigMatch(block, sigNewFunction, results)) {
    const args = results.args.match.slice();
    if (args.length > 0) {
      const fnBody = args.pop();
      const [bodyOk, bodyContent] = ctx.castToLiteral(fnBody);
      if (bodyOk) {
        return B.createFunctionFromString(args, bodyContent);
      }
    }
  }
  return block;
}

function transformArrayConstructorCallToFunction(ctx, block) {
  if (sigMatch(block, sigArrayConstructorCallToFunction)) {
    const arrayFn = getIn(block, 'callee.object.property.name');
    if (typeof Array.prototype[arrayFn] === 'function') {
      const args = Array.from(getIn(block, 'arguments'));
      if (args.length > 0) {
        const fnBody = args.pop();
        const [bodyOk, bodyContent] = ctx.castToLiteral(fnBody);
        if (bodyOk) {
          return B.createFunctionFromString(args, bodyContent);
        }
      }
    }
  }

  return block;
}

function transformStringAccessToDotAccess(ctx, block) {
  // a['xyz'] => a.xyz
  if (isLiteral(block.property) && isSafeString(block.property.value)) {
    return B.memberExpression(block.object, B.identifier(block.property.value), false);
  }
  return block;
}

function transformConstantIndexAccessToConstant(ctx, block) {
  let [propOk, property] = ctx.getPropertyName(block);

  // 'abc'[1] => 'b'
  if (propOk) {
    const [ok, object] = ctx.castToLiteral(block.object);
    if (ok) {
      const result = object[property];
      if (!isFunction(result)) {
        return B.createConstant(object[property]);
      }
    }
  }

  return block;
}

// BinaryExpression and LogicalExpression
function transform2OpExp(ctx, block) {
  const lits = ctx.castAllToLiteral([block.left, block.right]);

  if (lits) {
    const [left, right] = lits;
    const result = mixinSimple.staticOp2[block.operator](left, right);
    return B.createConstant(result);
  }

  return block;
}

// UnaryExpression and UpdateExpression
function transform1OpExp(ctx, block) {
  const [lit, arg] = ctx.castToLiteral(block.argument);
  if (lit) {
    let result;
    if (block.prefix) {
      result = mixinSimple.staticOp1Pre[block.operator](arg);
    } else {
      result = mixinSimple.staticOp1Post[block.operator](arg);
    }
    return B.createConstant(result);
  }
  return block;
}

function expandEvalString(ctx, block) {
  for (const [i, item] of block.entries()) {
    const result = {};
    if (sigMatch(item, sigEvalStatements, result)) {
      const code = String(result.code.match);
      const statements = B.codeToBlocks(code);
      return [true, [
        ...block.slice(0, i),
        ...statements,
        ...block.slice(i + 1),
      ]];
    }
  }

  return [false];
}

Object.assign(mixinSimple, {
  staticOp1Pre: opCache('a', op => `return ${op} a`),
  staticOp1Post: opCache('a', op => `return a ${op}`),
  staticOp2: opCache('ab', op => `return a ${op} b`),
  transform1OpExp,
  transform2OpExp,
  transformStringAccessToDotAccess,
  transformNewFunctionToFunction,
  transformConstantIndexAccessToConstant,
  transformLitToStringCall,
  transformAllowedSandboxFunctionCall,
  transformArrayConstructorCallToFunction,
  transformIifeReturnExpression,
  expandEvalString,
});

module.exports = mixinSimple;
