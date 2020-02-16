const test = require('tape');
const AstTransformer = require('../../AstTransformer');
const mixinPacker = require('../mixinPacker');

test('mixinPacker', t => {
  const code = `eval(function(p,a,c,k,e,r){e=String;if(!''.replace(/^/,String)){while(c--)r[c]=k[c]||c;k=[function(e){return r[e]}];e=function(){return'\\\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c]);return p}('0 4=1;0 5=2;6.7=3;',8,8,'var||||a|b|window|c'.split('|'),0,{}))`;
  const ast = new AstTransformer(code);
  ast.mixin(mixinPacker);
  ast.transform();
  t.equal(ast.getCode(), 'eval("var a=1;var b=2;window.c=3;");');

  t.end();
});
