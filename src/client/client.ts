import { postable_object_id_t } from '../base/type_t'
import { ObjectCreated, MessageType, ObjectUpdated, MapUpdated, MapAdded, MapDeleted, SetAdded, SetDelete, ArrayUpdated, ArraySpliced, MapCreated, SetCreated, ArrayCreated, ObjectDestroied, ServerEvent } from '../base/message-type'

import { observable, observe, ObservableSet, ObservableMap, IReactionDisposer, IObjectDidChange } from 'mobx';
import { assert } from 'base/common/assert';
import { PostableEventBase } from 'base/common';

const POSTABLE_PROPS = Symbol('postable_props')
const POSTABLE_ID = Symbol('postable_id')
const POSTABLE_ADMINISTRATOR = Symbol('postable_administrator')

export const ObjectStore = new Map<postable_object_id_t, any>();
export const ConstructorStore = new Map<string, any>();

function getObject<T>(id: number): T {
  const obj = ObjectStore.get(id);
  assert(obj, 'Object not exists. ' + id);
  return obj;
}

function onServerEvent(data: ServerEvent<any>) {
  const event = getObject<PostedEvent<any>>(data.object);
  event.fire(data.event);
}

@Posted('PostableEvent')
export class PostedEvent<T> implements PostableEventBase<T> {
  fire(event: T) {
    if (this.on) this.on(event);
  }
  on: (event: T) => void;
}

export function Posted(name: string) {
  return function(constructor: Function) {
    ConstructorStore.set(name, constructor);
  }
}

export function posted(self: any, prop: any) {
}

export interface PostedEventListener {
  onPostableInstanceCreated?(): void;
}

export const postableMessageHandler = function (data) {
  switch (data.type) {
    case MessageType.OBJECT_CREATED:
      createObject(data);
      break;
    case MessageType.MAP_CREATED:
      createMap(data);
      break;
    case MessageType.SET_CREATED:
      createSet(data);
      break;
    case MessageType.ARRAY_CREATED:
      createArray(data);
      break;
    case MessageType.OBJECT_DESTROIED:
    case MessageType.MAP_DESTROIED:
    case MessageType.SET_DESTROIED:
    case MessageType.ARRAY_DESTROIED:
      destroyObject(data);
      break;
    case MessageType.OBJECT_UPDTAED:
      updateObject(data);
      break;
    case MessageType.MAP_UPDATED:
      updateMap(data);
      break;
    case MessageType.MAP_ADDED:
      addMap(data);
      break;
    case MessageType.MAP_DELETED:
      deleteMap(data);
      break;
    case MessageType.SET_ADDED:
      addSet(data);
      break;
    case MessageType.SET_DELETED:
      deleteSet(data);
      break;
    case MessageType.ARRAY_UPDATED:
      updateArray(data);
      break;
    case MessageType.ARRAY_SPLICED:
      spliceArray(data);
      break;
    case MessageType.SERVER_EVENT:
      onServerEvent(data);
      break;
  }
}

function deserialize(d) {
  if (d.valueType == 'primitive') return d.value;
  return ObjectStore.get(d.value);
}

abstract class PostableAdministrator {
  reactions: Set<IReactionDisposer>;

  constructor(instance: any) {
    this.reactions = new Set();
  }

  addReaction(reaction: IReactionDisposer) {
    this.reactions.add(reaction);
  }
  removeReaction(reaction: IReactionDisposer) {
    assert(this.reactions.has(reaction), '[postable] no reaction exists');
    reaction();
    this.reactions.delete(reaction);
  }
  destroy() {
    this.reactions.forEach(reaction => reaction());
  }
}

class ObjectPostableAdministrator extends PostableAdministrator {
  values: any;

  constructor(instance: any, props: Set<string>) {
    super(instance);
    let values: any = {};
    props.forEach(prop => {
      values[prop] = instance[prop];
    })
    this.values = observable(values);
  }
}

class ContainerPostableAdministrator extends PostableAdministrator {

}

export function listenable(target: any, prop: string): any {
  asListenableProptotype(target);
  return addPostableProp(target, prop);
}

export function listen(instance: any, callback: (change: IObjectDidChange) => void) {
  asListenableObject(instance);
  let disposer;
  let admin = instance[POSTABLE_ADMINISTRATOR];
  if (admin.hasOwnProperty('values'))
    disposer = observe(admin.values, callback);
  else disposer = observe(instance, callback);
  admin.addReaction(disposer);
}

function asListenableProptotype(target: any) {
  if (target.hasOwnProperty(POSTABLE_PROPS)) return;
  let set;
  if (target.__proto__.hasOwnProperty(POSTABLE_PROPS))
    set = new Set(target.__proto__[POSTABLE_PROPS]);
  else set =  new Set();
  Object.defineProperty(target, POSTABLE_PROPS, {
    enumerable: false,
    writable: true,
    configurable: true,
    value: set
  })
}

function addPostableProp(target: any, prop: string) {
  return {
    enumerable: true,
    configurable: true,
    get() {
      asListenableObject(this);
      redefineProperty(this, prop);
      return this[prop];
    },
    set(value: any) {
      asListenableObject(this);
      redefineProperty(this, prop);
      this[prop] = value;
    }
  }
}

function redefineProperty(instance: any, prop: string) {
  delete instance[prop];
  Object.defineProperty(instance, prop, {
    get() {
      return instance[POSTABLE_ADMINISTRATOR].values[prop];
    },
    set(value: any) {
      if (typeof value != 'object') {
        instance[POSTABLE_ADMINISTRATOR].values[prop] = value;
        return;
      }
      instance[POSTABLE_ADMINISTRATOR].values[prop] = value;
      let postableID = value[POSTABLE_ID];
      let v = instance[POSTABLE_ADMINISTRATOR].values[prop];
      ObjectStore.set(postableID, v);
    }
  })
}

function asListenableObject(instance: any) {
  if (instance.hasOwnProperty(POSTABLE_ADMINISTRATOR)) return;
  if (instance instanceof ObservableSet ||
      instance instanceof ObservableMap ||
      Array.isArray(instance)) {
    Object.defineProperty(instance, POSTABLE_ADMINISTRATOR, {
      configurable: false,
      enumerable: false,
      value: new ContainerPostableAdministrator(instance)
    })
    return;
  }
  let props = instance[POSTABLE_PROPS];
  Object.defineProperty(instance, POSTABLE_ADMINISTRATOR, {
    configurable: false,
    enumerable: false,
    value: new ObjectPostableAdministrator(instance, props)
  })
}

function createObject(data: ObjectCreated) {
  const constructor = ConstructorStore.get(data.constructor);
  assert(constructor, `[postable] ${data.constructor} not exist`)
  const object = new constructor();
  for (var i = 0; i < data.props.length; i ++) {
    const prop = data.props[i][0];
    const value = deserialize(data.props[i][1]);
    object[prop] = value;
  }
  if (typeof object.onPostableInstanceCreated == 'function') object.onPostableInstanceCreated();
  Object.defineProperty(object, POSTABLE_ID, {value: data.id});
  ObjectStore.set(data.id, object);
}

function destroyObject(data: ObjectDestroied) {
  assert(ObjectStore.has(data.id), `[postable] Destroy failed. No such object ${data.id}`);
  ObjectStore.delete(data.id);
}

function updateObject(data: ObjectUpdated) {
  const object = ObjectStore.get(data.object);
  object[data.property] = deserialize(data.value);
}

function createMap(data: MapCreated) {
  const map = new Map();
  for (var i = 0; i < data.values.length; i ++) {
    let key = deserialize(map.values[i][0]);
    let value = deserialize(map.values[i][1]);
    map.set(key, value);
  }
  Object.defineProperty(map, POSTABLE_ID, {value: data.id});
  ObjectStore.set(data.id, map);
}

function updateMap(data: MapUpdated) {
  const object: Map<any, any> = ObjectStore.get(data.object);
  object.set(
    deserialize(data.name),
    deserialize(data.newValue))
}

function addMap(data: MapAdded) {
  const object: Map<any, any> = ObjectStore.get(data.object);
  object.set(
    deserialize(data.name),
    deserialize(data.newValue))
}

function deleteMap(data: MapDeleted) {
  const object: Map<any, any> = ObjectStore.get(data.object);
  object.delete(
    deserialize(data.name))
}

function createSet(data: SetCreated) {
  const set = new Set();
  data.values.forEach(v => {
    const value = deserialize(v);
    set.add(value);
  })
  Object.defineProperty(set, POSTABLE_ID, {value: data.id});
  ObjectStore.set(data.id, set);
}

function addSet(data: SetAdded) {
  const object: Set<any> = ObjectStore.get(data.object);
  object.add(deserialize(data.newValue))
}

function deleteSet(data: SetDelete) {
  const object: Set<any> = ObjectStore.get(data.object);
  object.delete(deserialize(data.oldValue))
}

function createArray(data: ArrayCreated) {
  const array = new Array();
  data.values.forEach(v => {
    const value = deserialize(v);
    array.push(value);
  })
  Object.defineProperty(array, POSTABLE_ID, {value: data.id});
  ObjectStore.set(data.id, array);
}

function updateArray(data: ArrayUpdated) {
  const object: Array<any> = ObjectStore.get(data.object);
  object[data.index] = deserialize(data.newValue);
}

function spliceArray(data: ArraySpliced) {
  const object: Array<any> = ObjectStore.get(data.object);
  data.added = data.added.map(d => deserialize(d))
  object.splice(data.index, data.removedCount, data.added);
}