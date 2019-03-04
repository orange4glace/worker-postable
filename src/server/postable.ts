import { observable, extendObservable, observe } from 'mobx'

let worker: Worker;

let __next_postable_object_id = 0;
function getNextPostableObjectID() {
  return __next_postable_object_id++;
}

function Postable<T extends {new(...args:any[]):{}}>(constructor:T) {
  const handler:ProxyHandler<T> = {
    construct: function(target, args) {
      let obj = Object.create(constructor.prototype);
      target.apply(obj, args);
      obj.__postable_id = getNextPostableObjectID();
      return obj;
    }
  }
  return new Proxy(constructor, handler)
}

function postable(target: any, key: string) {
  extendObservable(target, {
    [key]: target[key]
  });
  observe(target, key, change=> {
    if (change.type == 'update') {
      if (typeof change.newValue == 'object') {
        let value = change.newValue as any;
        if (!value.__postable_id) {
          value.__postable_id = getNextPostableObjectID();
          postObjectCreated(value);
        }
      }
      postValueUpdated(target, key, change.newValue);
    }
  })
}

function postObjectCreated(object: any) {
  worker.postMessage({
    type: 'object-created',
    constructor: object.constructor.name,
    id: object.__postable_id
  });
}

function postValueUpdated(object: any, property: string, value: any) {
  if (typeof value === 'object')
    worker.postMessage({
      type: 'value-updated',
      object: object.__postable_id,
      property: property,
      valueType: 'object',
      value: value.__postable_id
    })
  else
    worker.postMessage({
      type: 'value-updated',
      object: object.__postable_id,
      property: property,
      valueType: 'primitive',
      value: value
    })
}

function postMessage(message: any) {
  worker.postMessage(message);
}

export {
  Postable,
  postable
}