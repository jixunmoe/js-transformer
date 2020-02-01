// const B = require("recast").types.builders;

const sigMatch = require('./utils/sigMatch');

const sigIifeReturn = require('./sig/simp/sigIifeReturn');
const sigLitToStringCall = require('./sig/simp/sigLitToStringCall');
const sigStaticArrayConcat = require('./sig/simp/sigStaticArrayConcat');
const sigArrayConstructorCallToFunction = require('./sig/simp/sigArrayConstructorCallToFunction');

const {
  isLiteral,
  isFunction,
  isSafeString,
  getBlockType,
} = require('./utils/checks');

const B = require('./utils/builder');

const getIn = require('./utils/getIn');

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
]);

function transformAllowedSandboxFunctionCall(ctx, block) {
  const calleeType = getBlockType(block.callee);
  if (calleeType === 'Identifier') {
    const fn = block.callee.name;
    if (allowedSandboxFunction.has(fn)) {
      const [ok, args] = ctx.castToLiteral(block.arguments);
      if (ok) {
        const result = allowedSandboxFunction.get(fn)(...args);
        try {
          return B.createConstant(result);
        } catch (err) {
          // pass
        }
      }
    }
  } else if (calleeType === 'MemberExpression') {
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
    block.computed = false;
    block.property = B.identifier(block.property.value);
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
    const result = mixinSimple.staticOp1[block.operator](arg);
    return B.createConstant(result);
  }
  return block;
}


Object.assign(mixinSimple, {
  staticOp1: opCache('a', op => `return ${op}a`),
  staticOp2: opCache('ab', op => `return a${op}b`),
  transform1OpExp,
  transform2OpExp,
  transformStringAccessToDotAccess,
  transformConstantIndexAccessToConstant,
  transformLitToStringCall,
  transformAllowedSandboxFunctionCall,
  transformArrayConstructorCallToFunction,
  transformIifeReturnExpression,
});

module.exports = mixinSimple;
