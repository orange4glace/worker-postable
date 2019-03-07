import { observable, IArraySplice, IArrayChange, observe, ObservableSet, ObservableMap } from 'mobx'

const DEBUG = process.env.NODE_ENV !== "production";

const POSTABLE_ID_SYMBOL = Symbol('postable_id')
const POSTABLE_REF_COUNT = Symbol('postable_ref_count')
const POSTABLE_PROPS = Symbol('postable_props')
const POSTABLE_OBSERVE_DISPOSERS = Symbol('postable_observe_disposers')
const POSTABLE_FUNC_POST_CREATED = Symbol('postable_func_post_created')
const POSTABLE_FUNC_POST_DESTROIED = Symbol('postable_func_post_destroied')

export const OBFUSCATED_ERROR =
    "An invariant failed, however the error is obfuscated because this is an production build."
function invariant(check: boolean, message?: string | boolean) {
  if (!check) throw new Error("[mobx] " + (message || OBFUSCATED_ERROR))
}

interface Context {
  onMesssage: (message: any)=>void;
}

let context: Context = {
  onMesssage: ()=>{}
}

function isObject(value: any) {
  return (typeof value === 'object' && value != null)
}

let __next_postable_object_id = 0;
function getNextPostableObjectID() {
  return __next_postable_object_id++;
}

function Postable<T extends {new(...args:any[]):{}}>(constructor:T) {
  const handler:ProxyHandler<T> = {
    construct: function(target, args) {
      let instance = Object.create(constructor.prototype);
      target.apply(instance, args);
      asPostableObject(instance);
      return instance;
    }
  }
  return new Proxy(constructor, handler)
}

function postable(target: any, prop: string) {
  // Define property to __proto__
  if (!target.hasOwnProperty(POSTABLE_PROPS)) {
    Object.defineProperty(target, POSTABLE_PROPS, {
      enumerable: false,
      writable: true,
      configurable: true,
      value: new Set()
    })
    Object.defineProperty(target, POSTABLE_FUNC_POST_CREATED, {
      enumerable: false,
      writable: false,
      configurable: false,
      value: function() {
        let props: any = {};
        (this[POSTABLE_PROPS] as Set<string>).forEach(prop => {
          let value = this[prop];
          if (isObject(value)) {
            asPostableObject(value);
            ref(value);
          }
          props[prop] = serialize(value);
        })
        postMessage({
          type: 'object-created',
          constructor: this.constructor.name,
          id: this[POSTABLE_ID_SYMBOL],
          props: props
        });

        (this[POSTABLE_PROPS] as Set<string>).forEach(prop => {
          this[POSTABLE_OBSERVE_DISPOSERS].add(observe(this, prop, change => {
            if (change.type == 'update') {
              let oldValue = change.oldValue as any
              if (isObject(oldValue)) unref(oldValue);

              let value = change.newValue as any;
              if (isObject(value)) {
                let postable = asPostableObject(value);
                invariant(postable, `[postable] ${value} is not a Postable object.`);
                ref(postable);
              }
              postMessage({
                type: 'object-updated',
                object: this[POSTABLE_ID_SYMBOL],
                property: prop,
                value: serialize(value)
              })
            }
          }))
        })
        
      }
    })
    Object.defineProperty(target, POSTABLE_FUNC_POST_DESTROIED, {
      enumerable: false,
      writable: false,
      configurable: false,
      value: function() {
        (this[POSTABLE_PROPS] as Set<string>).forEach(prop => {
          let value = this[prop];
          if (typeof value == 'object' && value != null) unref(value);
        });
        (this[POSTABLE_OBSERVE_DISPOSERS] as Set<any>).forEach(disposer => {
          disposer();
        });
        postMessage({
          type: 'object-destroied',
          id: this[POSTABLE_ID_SYMBOL]
        });

        this[POSTABLE_OBSERVE_DISPOSERS].forEach(disposer => disposer())
        this[POSTABLE_OBSERVE_DISPOSERS].clear();
      }
    })
  }
  target[POSTABLE_PROPS].add(prop);
  return observable(target, prop);
}



Object.defineProperty(Array.prototype, POSTABLE_FUNC_POST_CREATED, {
  enumerable: false,
  writable: false,
  configurable: false,
  value: function() {
    let values = [];
    (this as Array<any>).forEach(el => {
      if (isObject(el)) ref(el);
      values.push(serialize(el))
    });
    postMessage({
      type: 'object-created',
      constructor: this.constructor.name,
      id: this[POSTABLE_ID_SYMBOL],
      values: values
    });
    this[POSTABLE_OBSERVE_DISPOSERS].add(observeArray(this));
  }
})
Object.defineProperty(Array.prototype, POSTABLE_FUNC_POST_DESTROIED, {
  enumerable: false,
  writable: false,
  configurable: false,
  value: function() {
    (this as Array<any>).forEach(el => {
      if (isObject(el)) unref(el);
    });
    (this[POSTABLE_OBSERVE_DISPOSERS] as Set<any>).forEach(disposer => {
      disposer();
    });
    postMessage({
      type: 'object-destroied',
      id: this[POSTABLE_ID_SYMBOL]
    });
    this[POSTABLE_OBSERVE_DISPOSERS].forEach(disposer => disposer())
    this[POSTABLE_OBSERVE_DISPOSERS].clear();
  }
})

Object.defineProperty(ObservableSet.prototype, POSTABLE_FUNC_POST_CREATED, {
  enumerable: false,
  writable: false,
  configurable: false,
  value: function() {
    let values = [];
    (this as Set<any>).forEach(el => {
      if (isObject(el)) ref(el);
      values.push(serialize(el))
    });
    postMessage({
      type: 'object-created',
      constructor: this.constructor.name,
      id: this[POSTABLE_ID_SYMBOL],
      values: values
    });
    this[POSTABLE_OBSERVE_DISPOSERS].add(observeSet(this));
  }
})
Object.defineProperty(ObservableSet.prototype, POSTABLE_FUNC_POST_DESTROIED, {
  enumerable: false,
  writable: false,
  configurable: false,
  value: function() {
    (this as Set<any>).forEach(el => {
      if (isObject(el)) unref(el);
    });
    (this[POSTABLE_OBSERVE_DISPOSERS] as Set<any>).forEach(disposer => {
      disposer();
    });
    postMessage({
      type: 'object-destroied',
      id: this[POSTABLE_ID_SYMBOL]
    });
    this[POSTABLE_OBSERVE_DISPOSERS].forEach(disposer => disposer())
    this[POSTABLE_OBSERVE_DISPOSERS].clear();
  }
})

Object.defineProperty(ObservableMap.prototype, POSTABLE_FUNC_POST_CREATED, {
  enumerable: false,
  writable: false,
  configurable: false,
  value: function() {
    let values = [];
    (this as Map<any, any>).forEach((k, v) => {
      if (isObject(v)) ref(v);
      if (isObject(k)) ref(k);
      values.push([serialize(k), serialize(v)])
    });
    postMessage({
      type: 'object-created',
      constructor: this.constructor.name,
      id: this[POSTABLE_ID_SYMBOL],
      values: values
    });
    this[POSTABLE_OBSERVE_DISPOSERS].add(observeMap(this));
  }
})
Object.defineProperty(ObservableMap.prototype, POSTABLE_FUNC_POST_DESTROIED, {
  enumerable: false,
  writable: false,
  configurable: false,
  value: function() {
    (this as Map<any, any>).forEach((k, v) => {
      if (isObject(k)) unref(k);
      if (isObject(v)) unref(v);
    });
    (this[POSTABLE_OBSERVE_DISPOSERS] as Set<any>).forEach(disposer => {
      disposer();
    });
    postMessage({
      type: 'object-destroied',
      id: this[POSTABLE_ID_SYMBOL]
    });
    this[POSTABLE_OBSERVE_DISPOSERS].forEach(disposer => disposer())
    this[POSTABLE_OBSERVE_DISPOSERS].clear();
  }
})

function asPostableObject(target: any) {
  if (!target.__proto__.hasOwnProperty(POSTABLE_FUNC_POST_CREATED)) return null;
  if (target.hasOwnProperty(POSTABLE_ID_SYMBOL)) return target;
  Object.defineProperty(target, POSTABLE_ID_SYMBOL, {
    enumerable: false,
    writable: false,
    configurable: false,
    value: getNextPostableObjectID()
  })
  Object.defineProperty(target, POSTABLE_REF_COUNT, {
    enumerable: false,
    writable: true,
    configurable: false,
    value: 0
  })
  Object.defineProperty(target, POSTABLE_OBSERVE_DISPOSERS, {
    enumerable: false,
    writable: false,
    configurable: false,
    value: new Set()
  })
  return target;
}

function ref(object: any) {
  if (object[POSTABLE_REF_COUNT] == 0)
    object[POSTABLE_FUNC_POST_CREATED].call(object);
  object[POSTABLE_REF_COUNT]++;
}

function unref(object: any) {
  object[POSTABLE_REF_COUNT]--;
  if (object[POSTABLE_REF_COUNT] == 0)
    object[POSTABLE_FUNC_POST_DESTROIED].call(object);
}


function serialize(d: any) {
  return (typeof d == 'object' ? 
    {
      valueType: 'object',
      value: d[POSTABLE_ID_SYMBOL]
    } : {
      valueType: 'primitive',
      value: d
    });
}



function observeMap(data: any) {
  return observe(data, change => {
    if (change.type == 'update') postMapUpdate(change);
    else if (change.type == 'add') postMapAdd(change);
    else if (change.type == 'delete') postMapDelete(change);
  })
}

function postMapUpdate(c: any) {
  if (isObject(c.newValue)) ref(c.newValue);
  if (isObject(c.oldValue)) unref(c.oldValue);
  c.type = 'map-update';
  c.object = c.object[POSTABLE_ID_SYMBOL];
  c.name = serialize(c.name);
  c.newValue = serialize(c.newValue);
  c.oldValue = serialize(c.oldValue);
  postMessage(c);
}

function postMapAdd(c: any) {
  if (isObject(c.newValue)) ref(c.newValue);
  c.type = 'map-add';
  c.object = c.object[POSTABLE_ID_SYMBOL];
  c.name = serialize(c.name);
  c.newValue = serialize(c.newValue);
  postMessage(c);
}

function postMapDelete(c: any) {
  if (isObject(c.oldValue)) unref(c.oldValue);
  c.type = 'map-delete';
  c.object = c.object[POSTABLE_ID_SYMBOL];
  c.name = serialize(c.name);
  c.oldValue = serialize(c.oldValue);
  postMessage(c);
}



function observeSet(data: any) {
  return observe(data, change => {
    if ((change.type as any) == 'add') postSetAdd(change);
    if ((change.type as any) == 'delete') postSetDelete(change);
  })
}

function postSetAdd(c: any) {
  if (isObject(c.newValue)) ref(c.newValue);
  c.type = 'set-add';
  c.object = c.object[POSTABLE_ID_SYMBOL];
  c.newValue = serialize(c.newValue);
  postMessage(c);
}

function postSetDelete(c: any) {
  if (isObject(c.oldValue)) unref(c.oldValue);
  c.type = 'set-delete';
  c.object = c.object[POSTABLE_ID_SYMBOL];
  c.oldValue = serialize(c.oldvalue);
  postMessage(c);
}



function observeArray(data: any) {
  return observe(data, change => {
    if (change.type == 'update') postArrayUpdate(change as unknown as IArrayChange);
    else if (change.type == 'splice') postArraySplice(change as unknown as IArraySplice);
  })
}

function postArrayUpdate(c: any) {
  if (isObject(c.newValue)) ref(c.newValue);
  if (isObject(c.oldValue)) unref(c.oldValue);
  c.type = 'array-update';
  c.object = c.object[POSTABLE_ID_SYMBOL];
  c.newValue = serialize(c.newValue);
  c.oldValue = serialize(c.oldValue);
  postMessage(c);
}

function postArraySplice(c: any) {
  c.type = 'array-splice';
  c.object = c.object[POSTABLE_ID_SYMBOL];
  c.added = c.added.map(d => {
    if (isObject(d)) ref(d);
    serialize(d)
  })
  c.removed = c.removed.map(d => {
    if (isObject(d)) unref(d);
    serialize(d)
  })
  postMessage(c);
}




function postMessage(message: any) {
  context.onMesssage(message);
}

export {
  Postable,
  postable,
  ref,
  unref,
  context
}