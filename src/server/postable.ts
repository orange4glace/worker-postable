import { observable, IArraySplice, IArrayChange, observe, ObservableSet, ObservableMap } from 'mobx'
import { MessageType } from '../common/message-type';
import { invariant } from '../common/util'

const DEBUG = process.env.NODE_ENV !== "production";

const POSTABLE_PROPS = Symbol('postable_props')
const POSTABLE_FUNC_POST_CREATED = Symbol('postable_func_post_created')
const POSTABLE_FUNC_POST_DESTROIED = Symbol('postable_func_post_destroied')

const POSTABLE_ADMINISTRATOR = Symbol('postable_administrator')

interface Context {
  onMessage: (message: any)=>void;
}

let context: Context = {
  onMessage: ()=>{}
}

function isObject(value: any) {
  return (typeof value === 'object' && value != null)
}

let __next_postable_object_id = 0;
function getNextPostableObjectID() {
  return __next_postable_object_id++;
}


function Postable/*<T extends {new(...args:any[]):{}}>*/(constructor/*:T*/) {
  asPostablePrototype(constructor.prototype);
  const handler/*:ProxyHandler<T>*/ = {
    construct: function(target, args) {
      let instance = Object.create(constructor.prototype);
      target.apply(instance, args);
      asPostableObject(instance);
      return instance;
    }
  }
  return new Proxy(constructor, handler)
}
/*
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
*/

function postable(target: any, prop: string) {
  if (typeof target[prop] == 'function') return;
  asPostablePrototype(target);
  // Define property to __proto__
  target[POSTABLE_PROPS].add(prop);
  return observable(target, prop);
}

function asPostablePrototype(target: any) {
  if (!target.hasOwnProperty(POSTABLE_PROPS)) {
    let set;
    if (target.__proto__.hasOwnProperty(POSTABLE_PROPS)) set = new Set(target.__proto__[POSTABLE_PROPS]);
    else set =  new Set();
    Object.defineProperty(target, POSTABLE_PROPS, {
      enumerable: false,
      writable: true,
      configurable: true,
      value: set
    })
    Object.defineProperty(target, POSTABLE_FUNC_POST_CREATED, {
      enumerable: false,
      writable: false,
      configurable: false,
      value: function() {
        let props: any[] = [];
        (this[POSTABLE_PROPS] as Set<string>).forEach(prop => {
          let value = this[prop];
          if (isObject(value)) {
            asPostableObject(value);
            ref(value);
          }
          props.push([prop, serialize(value)]);
        })
        postMessage({
          type: MessageType.OBJECT_CREATED,
          constructor: this.constructor.name,
          id: this[POSTABLE_ADMINISTRATOR].id,
          props: props
        });

        (this[POSTABLE_PROPS] as Set<string>).forEach(prop => {
          this[POSTABLE_ADMINISTRATOR].observeDisposers.add(observe(this, prop, change => {
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
                type: MessageType.OBJECT_UPDTAED,
                object: this[POSTABLE_ADMINISTRATOR].id,
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
        (this[POSTABLE_ADMINISTRATOR].observeDisposers as Set<any>).forEach(disposer => {
          disposer();
        });
        postMessage({
          type: MessageType.OBJECT_DESTROIED,
          id: this[POSTABLE_ADMINISTRATOR].id
        });

        this[POSTABLE_ADMINISTRATOR].observeDisposers.forEach(disposer => disposer())
        this[POSTABLE_ADMINISTRATOR].observeDisposers.clear();
      }
    })
  }
}


function asPostableObject(target: any) {
  if (!target.__proto__.hasOwnProperty(POSTABLE_FUNC_POST_CREATED)) return null;
  if (target.hasOwnProperty(POSTABLE_ADMINISTRATOR)) return target;
  Object.defineProperty(target, POSTABLE_ADMINISTRATOR, {
    enumerable: false,
    writable: false,
    configurable: false,
    value: {
      id: getNextPostableObjectID(),
      refCount: 0,
      observeDisposers: new Set()
    }
  })
  return target;
}


Object.defineProperty(Array.prototype, POSTABLE_FUNC_POST_CREATED, {
  enumerable: false,
  writable: false,
  configurable: false,
  value: function() {
    let values = [];
    (this as Array<any>).forEach(el => {
      if (isObject(el)) {
        asPostableObject(el);
        ref(el);
      }
      values.push(serialize(el))
    });
    postMessage({
      type: MessageType.ARRAY_CREATED,
      id: this[POSTABLE_ADMINISTRATOR].id,
      values: values
    });
    this[POSTABLE_ADMINISTRATOR].observeDisposers.add(observeArray(this));
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
    (this[POSTABLE_ADMINISTRATOR].observeDisposers as Set<any>).forEach(disposer => {
      disposer();
    });
    postMessage({
      type: MessageType.ARRAY_DESTROIED,
      id: this[POSTABLE_ADMINISTRATOR].id
    });
    this[POSTABLE_ADMINISTRATOR].observeDisposers.forEach(disposer => disposer())
    this[POSTABLE_ADMINISTRATOR].observeDisposers.clear();
  }
})

Object.defineProperty(ObservableSet.prototype, POSTABLE_FUNC_POST_CREATED, {
  enumerable: false,
  writable: false,
  configurable: false,
  value: function() {
    let values = [];
    (this as Set<any>).forEach(el => {
      if (isObject(el)) {
        asPostableObject(el);
        ref(el);
      }
      values.push(serialize(el))
    });
    postMessage({
      type: MessageType.SET_CREATED,
      id: this[POSTABLE_ADMINISTRATOR].id,
      values: values
    });
    this[POSTABLE_ADMINISTRATOR].observeDisposers.add(observeSet(this));
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
    (this[POSTABLE_ADMINISTRATOR].observeDisposers as Set<any>).forEach(disposer => {
      disposer();
    });
    postMessage({
      type: MessageType.SET_DESTROIED,
      id: this[POSTABLE_ADMINISTRATOR].id
    });
    this[POSTABLE_ADMINISTRATOR].observeDisposers.forEach(disposer => disposer())
    this[POSTABLE_ADMINISTRATOR].observeDisposers.clear();
  }
})

Object.defineProperty(ObservableMap.prototype, POSTABLE_FUNC_POST_CREATED, {
  enumerable: false,
  writable: false,
  configurable: false,
  value: function() {
    let values = [];
    (this as Map<any, any>).forEach((k, v) => {
      if (isObject(k)) {
        asPostableObject(k);
        ref(k);
      }
      if (isObject(v)) {
        asPostableObject(v);
        ref(v);
      }
      values.push([serialize(k), serialize(v)])
    });
    postMessage({
      type: MessageType.MAP_CREATED,
      id: this[POSTABLE_ADMINISTRATOR].id,
      values: values
    });
    this[POSTABLE_ADMINISTRATOR].observeDisposers.add(observeMap(this));
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
    (this[POSTABLE_ADMINISTRATOR].observeDisposers as Set<any>).forEach(disposer => {
      disposer();
    });
    postMessage({
      type: MessageType.MAP_DESTROIED,
      id: this[POSTABLE_ADMINISTRATOR].id
    });
    this[POSTABLE_ADMINISTRATOR].observeDisposers.forEach(disposer => disposer())
    this[POSTABLE_ADMINISTRATOR].observeDisposers.clear();
  }
})

function ref(object: any) {
  if (object[POSTABLE_ADMINISTRATOR].refCount == 0)
    object[POSTABLE_FUNC_POST_CREATED].call(object);
  object[POSTABLE_ADMINISTRATOR].refCount++;
}

function unref(object: any) {
  object[POSTABLE_ADMINISTRATOR].refCount--;
  if (object[POSTABLE_ADMINISTRATOR].refCount == 0)
    object[POSTABLE_FUNC_POST_DESTROIED].call(object);
}


function serialize(d: any) {
  return (isObject(d) ? 
    {
      valueType: 'object',
      value: d[POSTABLE_ADMINISTRATOR].id
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
  if (isObject(c.newValue)) {
    asPostableObject(c.newValue);
    ref(c.newValue);
  }
  if (isObject(c.oldValue)) unref(c.oldValue);
  c.type = MessageType.MAP_UPDATED;
  c.object = c.object[POSTABLE_ADMINISTRATOR].id;
  c.name = serialize(c.name);
  c.newValue = serialize(c.newValue);
  c.oldValue = serialize(c.oldValue);
  postMessage(c);
}

function postMapAdd(c: any) {
  if (isObject(c.newValue)) {
    asPostableObject(c.newValue);
    ref(c.newValue);
  }
  c.type = MessageType.MAP_ADDED;
  c.object = c.object[POSTABLE_ADMINISTRATOR].id;
  c.name = serialize(c.name);
  c.newValue = serialize(c.newValue);
  postMessage(c);
}

function postMapDelete(c: any) {
  if (isObject(c.oldValue)) unref(c.oldValue);
  c.type = MessageType.MAP_DELETED;
  c.object = c.object[POSTABLE_ADMINISTRATOR].id;
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
  if (isObject(c.newValue)) {
    asPostableObject(c.newValue);
    ref(c.newValue);
  }
  c.type = MessageType.SET_ADDED;
  c.object = c.object[POSTABLE_ADMINISTRATOR].id;
  c.newValue = serialize(c.newValue);
  postMessage(c);
}

function postSetDelete(c: any) {
  if (isObject(c.oldValue)) unref(c.oldValue);
  c.type = MessageType.SET_DELETED;
  c.object = c.object[POSTABLE_ADMINISTRATOR].id;
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
  if (isObject(c.newValue)) {
    asPostableObject(c.newValue);
    ref(c.newValue);
  }
  if (isObject(c.oldValue)) unref(c.oldValue);
  c.type = MessageType.ARRAY_UPDATED;
  c.object = c.object[POSTABLE_ADMINISTRATOR].id;
  c.newValue = serialize(c.newValue);
  c.oldValue = serialize(c.oldValue);
  postMessage(c);
}

function postArraySplice(c: any) {
  c.type = MessageType.ARRAY_SPLICED;
  c.object = c.object[POSTABLE_ADMINISTRATOR].id;
  c.added = c.added.map(d => {
    if (isObject(d)) {
      asPostableObject(d);
      ref(d);
    }
    serialize(d)
  })
  c.removed = c.removed.map(d => {
    if (isObject(d)) unref(d);
    serialize(d)
  })
  postMessage(c);
}




function postMessage(message: any) {
  context.onMessage(message);
}

function getPostableID(object: any) {
  return object[POSTABLE_ADMINISTRATOR].id;
}

export {
  Postable,
  postable,
  ref,
  unref,
  getPostableID,
  context
}