/**
 * @file mixinScope.js
 * @description
 * A highly experimental and unstable static constant annotator & constant variable folding.
 * goal: reconstruct code encoded with [aaencode](http://utf-8.jp/public/aaencode.html)
 */

const mixinSimple = require('./mixinSimple');
const mixinProps = require('../utils/mixinProps');
const Scope = require('../scope/Scope');
const print = require('../utils/print');

const B = require('../utils/builder');

const scopes = Symbol('SCOPES');
const newScope = Symbol('NEW_SCOPE');
const dropScope = Symbol('DROP_SCOPE');
const lastScope = Symbol('LAST_SCOPE');
const resetScope = Symbol('RESET_SCOPE');

const flagDryRun = Symbol('DRY_RUN');
const scopeValue = Symbol('Calculated Static Value');
const transformsApplied = Symbol('Number of transformation applied.');

function mixinScope(transformer) {
  transformer.mixin(mixinScope);
}

const scopeFns = {
  [newScope]: (ctx, from) => {
    const scope = new Scope(from);
    ctx[scopes].push(scope);
    return scope;
  },

  [lastScope]: ctx => {
    return ctx[scopes][ctx[scopes].length - 1];
  },

  [dropScope]: ctx => {
    ctx[scopes].pop();
  },

  [resetScope]: ctx => {
    ctx[scopes] = [];
    ctx[newScope](null);
  },

  scopedTransform: (ctx, pass) => {
    let needContinue = true;
    let passRun = 0;
    while(passRun < pass && needContinue) {
      passRun++;

      console.info('running pass %d', passRun);

      ctx.transform();

      ctx[resetScope]();
      const scope = ctx[lastScope]();
      ctx.annotateScope(scope, ctx.ast.program.body);
      if (ctx[flagDryRun]) {
        ctx[transformsApplied] = 0;
        ctx.walk(ctx.ast.program, ctx.applyCalculatedScopeValue);
        needContinue = ctx[transformsApplied] > 0;
      }
    }
  },

  applyCalculatedScopeValue: (ctx, ctx2, block) => {
    if (Object.getOwnPropertySymbols(block).includes(scopeValue)) {
      ctx[transformsApplied]++;
      return B.createConstant(block[scopeValue]);
    }

    return block;
  },

  annotateBlock: (ctx, scope, block, queue) => {
    let annotateRecursive = false;
    switch (block.type) {
      case 'FunctionExpression':
        queue.add(block.body.body);
        break;

      case 'ExpressionStatement':
        ctx.annotateBlock(scope, block.expression, queue);
        break;

      case 'CallExpression':
        ctx.annotateScope(scope, block.arguments);
        if (block.callee.type === 'FunctionExpression') {
          // FIXME: handle iife arguments passed in.
          if (block.arguments.length > 0 || block.callee.params.length > 0) {
            throw new Error('FIXME: handle iffe with arguments');
          }
          ctx.annotateScope(scope.inherit(), block.callee.body.body);
        } else {
          ctx.annotateBlock(scope, block.callee, queue);
        }
        break;

      case 'ReturnStatement':
        ctx.annotateBlock(scope, block.argument, queue);
        break;

      case 'UpdateExpression':
        if (block.argument.type === 'Identifier') {
          scope.prop(block.left.name).read().write(block.argument);
        } else {
          // TODO: What else could be updated?
        }
        break;

      case 'Identifier': {
        const rhs = scope.prop(block.name).read();
        if (!rhs.dirty) {
          const [ok, value] = rhs.getStaticValue(ctx, scope);
          if (ok) {
            if (ctx[flagDryRun]) {
              block[scopeValue] = value;
              B.addComment(block, B.commentBlock(`{val:${block.name}(${JSON.stringify(value)})}`, false, true));
            } else {
              return block;
            }
          }
        }
        break;
      }

      case 'VariableDeclaration': {
        block.declarations.forEach(block => {
          ctx.annotateBlock(scope, block, queue);
        });
        break;
      }

      case 'VariableDeclarator': {
        const right = ctx.annotateAndGetRhsNode(scope, block.init, queue);
        scope.define(block.id.name, right);
        B.addComment(block.id, B.commentBlock('{init}', false, true));
        break;
      }

      case 'AssignmentExpression': {
        const right = ctx.annotateAndGetRhsNode(scope, block.right, queue);

        if (block.left.type === 'Identifier') {
          scope.prop(block.left.name).write(right);
          B.addComment(block.left, B.commentBlock('{set}', false, true));
        } else {
          // TODO: Member expression?
        }
        break;
      }

      default:
        annotateRecursive = true;
        break;
    }

    if (annotateRecursive) {
      ctx.walk(block, (ctx, nextBlock) => {
        if (block !== nextBlock) {
          ctx.annotateBlock(scope, nextBlock, queue);
        }
        return nextBlock;
      });
    }
  },

  annotateScope: (ctx, scope, blocks) => {
    const nestScopedBlocks = new Set();
    if (!Array.isArray(blocks)) {
      print(blocks);
      throw new Error('annotateScript should be called with Array, not a block.');
    }

    for (const block of blocks) {
      ctx.annotateBlock(scope, block, nestScopedBlocks);
    }

    nestScopedBlocks.forEach(nestScoped => {
      const nextScope = scope.inherit();
      ctx.annotateScope(nextScope, nestScoped);
      ctx[dropScope]();
    });
    nestScopedBlocks.clear();
  },

  annotateAndGetRhsNode(ctx, scope, block, queue) {
    if (block.type === 'ExpressionStatement') {
      return ctx.annotateAndGetRhsNode(scope, block.expression);
    }

    if (block.type === 'AssignmentExpression') {
      ctx.annotateBlock(scope, block, queue);
      return block.left;
    }

    ctx.annotateBlock(scope, block, queue);
    return block; // ExpressionStatement
  }
};

mixinScope.setup = function (transformer) {
  transformer.mixin(mixinSimple);

  transformer[scopes] = [];
  transformer[flagDryRun] = true;
  mixinProps(transformer, scopeFns);
};

Object.assign(mixinScope, {
  addScope: newScope,
  dropScope,
  lastScope,
  resetScope,
});

module.exports = mixinScope;
