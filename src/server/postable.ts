import { observable, extendObservable, observe } from 'mobx'
import { ObservableValue, IArraySplice, IArrayChange, IObjectDidChange, IMapDidChange } from 'mobx/lib/internal';

const POSTABLE_ID_SYMBOL = Symbol('postable_id')

interface Context {
  worker: Worker
}

let context: Context = {
  worker: null
}

let __next_postable_object_id = 0;
function getNextPostableObjectID() {
  return __next_postable_object_id++;
}

function Postable<T extends {new(...args:any[]):{}}>(constructor:T) {
  const handler:ProxyHandler<T> = {
    construct: function(target, args) {
      let obj = Object.create(constructor.prototype);
      target.apply(obj, args);
      if (!obj.hasOwnProperty(POSTABLE_ID_SYMBOL)) {
        Object.defineProperty(obj, POSTABLE_ID_SYMBOL, {
          value: getNextPostableObjectID(),
          writable: false
        })
        postObjectCreated(obj);
      }
      return obj;
    }
  }
  return new Proxy(constructor, handler)
}

function postable(target: any, prop: string): any {

  function intializer(target: any, prop: string) {
    if (!this.hasOwnProperty(POSTABLE_ID_SYMBOL)) {
      Object.defineProperty(this, POSTABLE_ID_SYMBOL, {
        value: getNextPostableObjectID(),
        writable: false
      })
      postObjectCreated(this);
    }
    extendObservable(this, {
      ['__'+prop]: 0
    });
    observe(this, '__'+prop, change=> {
      if (change.type == 'update') {
        if (typeof change.newValue == 'object') {
          let value = change.newValue as any;
          if (!value.hasOwnProperty(POSTABLE_ID_SYMBOL)) {
            Object.defineProperty(value, POSTABLE_ID_SYMBOL, {
              value: getNextPostableObjectID(),
              writable: false
            })
            postObjectCreated(value);
          }
          const objectType = value.constructor.name;
          if (objectType == 'Array') observeArray(value);
          if (objectType == 'ObservableSet$$1') observeSet(value);
          if (objectType == 'ObservableMap$$1') observeMap(value);
        }
        postObjectUpdated(this, prop, change.newValue);
      }
    })
    Object.defineProperty(this, prop, {
      configurable: true,
      get() {
        return this['__'+prop];
      },
      set(value) {
        this['__'+prop] = value;
      }
    })
  }

  function gee(target: any, prop: string) {
    return {
      configurable: true,
      get() {
        intializer.call(this, target, prop);
        return this[prop];
      },
      set(value) {
        intializer.call(this, target, prop);
        return this[prop] = value;
      }
    }
  }

  return gee.apply(this, arguments);
/*
  if (!target.hasOwnProperty('__postable_id')) {
    Object.defineProperty(target, "__postable_id", {
      value: getNextPostableObjectID(),
      writable: false
    })
    postObjectCreated(target);
  }
  extendObservable(target, {
    [key]: target[key]
  });
  observe(target, key, change=> {
    if (change.type == 'update') {
      if (typeof change.newValue == 'object') {
        let value = change.newValue as any;
        if (!value.hasOwnProperty('__postable_id')) {
          Object.defineProperty(value, '__postable_id', {
            value: getNextPostableObjectID(),
            writable: false
          })
          postObjectCreated(value);
        }
      }
      postValueUpdated(target, key, change.newValue);
    }
  })
  */
}

function postObjectCreated(object: any) {
  postMessage({
    type: 'object-created',
    constructor: object.constructor.name,
    id: object[POSTABLE_ID_SYMBOL]
  });
}

function postObjectUpdated(object: any, property: string, value: any) {
  postMessage({
    type: 'object-updated',
    object: object[POSTABLE_ID_SYMBOL],
    property: property,
    value: serialize(value)
  })
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
  observe(data, change => {
    if (change.type == 'update') postMapUpdate(change);
    else if (change.type == 'add') postMapAdd(change);
    else if (change.type == 'delete') postMapDelete(change);
  })
}

function postMapUpdate(c: any) {
  c.type = 'map-update';
  c.object = c.object[POSTABLE_ID_SYMBOL];
  c.name = serialize(c.name);
  c.newValue = serialize(c.newValue);
  delete c.oldValue;
  postMessage(c);
}

function postMapAdd(c: any) {
  c.type = 'map-add';
  c.object = c.object[POSTABLE_ID_SYMBOL];
  c.name = serialize(c.name);
  c.newValue = serialize(c.newValue);
  delete c.oldValue;
  postMessage(c);
}

function postMapDelete(c: any) {
  c.type = 'map-delete';
  c.object = c.object[POSTABLE_ID_SYMBOL];
  c.name = serialize(c.name);
  delete c.oldValue;
  postMessage(c);
}



function observeSet(data: any) {
  observe(data, change => {
    if ((change.type as any) == 'add') postSetAdd(change);
    if ((change.type as any) == 'delete') postSetDelete(change);
  })
}

function postSetAdd(c: any) {
  c.type = 'set-add';
  c.object = c.object[POSTABLE_ID_SYMBOL];
  c.newValue = serialize(c.newValue);
  delete c.oldValue;
  postMessage(c);
}

function postSetDelete(c: any) {
  c.type = 'set-delete';
  c.object = c.object[POSTABLE_ID_SYMBOL];
  c.oldValue = serialize(c.oldvalue);
  postMessage(c);
}



function observeArray(data: any) {
  observe(data, change => {
    if (change.type == 'update') postArrayUpdate(change as unknown as IArrayChange);
    else if (change.type == 'splice') postArraySplice(change as unknown as IArraySplice);
  })
}

function postArrayUpdate(data: any) {
  data.type = 'array-update';
  data.object = data.object[POSTABLE_ID_SYMBOL];
  data.newValue = serialize(data.newValue);
  data.oldValue = serialize(data.oldValue);
  postMessage(data);
}

function postArraySplice(data: any) {
  data.type = 'array-splice';
  data.object = data.object[POSTABLE_ID_SYMBOL];
  data.added = data.added.map(d => serialize(d))
  data.removed = data.removed.map(d => serialize(d))
  postMessage(data);
}




function postMessage(message: any) {
  console.log('POST', message)
  context.worker.postMessage(message);
}

function registerWorker(worker: Worker) {
  context.worker = worker;
}

export {
  Postable,
  postable,
  registerWorker
}