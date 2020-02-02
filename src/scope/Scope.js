const B = require('../utils/builder');

class Scope {
  constructor(name, parent) {
    this._name = name;
    this._read = false;
    this._write = false;

    /**
     * @type {Map<String, Scope>}
     */
    this.props = new Map();
    this._value = B.identifier('undefined');

    this.parent = parent;
  }

  inherit() {
    const inst = new Scope(`inherit(${this._name})`);
    inst._read = this._read;
    inst._write = this._write;
    inst._value = this._value;
    inst.parent = this;
    return inst;
  }

  getParentProp(name) {
    let next = this.parent;
    while(next) {
      if (next.hasProp(name)) {
        return next.props.get(name);
      }
      next = next.parent;
    }
    return null;
  }

  getProp(name) {
    if (this.hasProp(name)) {
      return this.props.get(name);
    }

    return this.getParentProp(name);
  }

  /**
   * @param {String} name
   * @returns {Scope}
   */
  prop(name) {
    let prop = this.getProp(name);
    if (prop) {
      return prop;
    }

    prop = new Scope(name, this);
    this.props.set(name, prop);
    return prop;
  }

  define(name, value) {
    this.props.delete(name);
    this.prop(name).write(value);
    return this;
  }

  hasProp(name) {
    return this.props.has(name);
  }

  read() {
    this._read = true;
    return this;
  }

  write(value) {
    this._write = true;
    // dirty = read after write
    this._dirty = this._read;

    if (value.type === 'Identifier') {
      const prop = this.getProp(value.name);

      if (prop) {
        value = prop._value;
      }
    }

    this._value = value;
    return this;
  }

  /**
   * @param {AstTransformer} ctx
   * @param {Scope} scope
   */
  getStaticValue(ctx, scope) {
    if (this.dirty) return [false];

    if (this._value.type === 'Identifier') {
      if (this._value.name === this._name) {
        // TODO: detect chained recursive call
        return [false, 'self recursive'];
      }
      if (scope.props.has(this._value._name)) {
        return scope.props.get(this._value.name).getStaticValue(ctx, scope);
      }
    } else {
      return ctx.castToLiteral(this._value);
    }

    return [false];
  }

  get usedAnywhere() {
    return this._read || this.dirty;
  }

  get dirty() {
    return this._dirty || this.anyDirtyProp;
  }

  get anyDirtyProp() {
    for (const prop of this.props.values()) {
      if (prop.dirty) {
        return true;
      }
    }

    return false;
  }
}

module.exports = Scope;
