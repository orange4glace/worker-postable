import { postable_object_id_t } from '../common/type_t'
import { ObjectCreated, MessageType, ObjectUpdated, MapUpdated, MapAdded, MapDeleted, SetAdded, SetDelete, ArrayUpdated, ArraySpliced, MapCreated, SetCreated, ArrayCreated, ObjectDestroied } from '../common/message-type'

import { EventEmitter2 } from 'eventemitter2'
import { invariant } from '../common/util';

const ObjectStore = new Map<postable_object_id_t, any>();
const ConstructorStore = new Map<string, any>();
const ee = new EventEmitter2();

const postableMessageHandler = function (msg) {
  const data = msg.data;
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
  }
}

function deserialize(d) {
  if (d.valueType == 'primitive') return d.value;
  return ObjectStore.get(d.value);
}

function createObject(data: ObjectCreated) {
  const constructor = ConstructorStore.get(data.constructor);
  invariant(constructor, `[postable] ${data.constructor} not exist`)
  const object = new constructor();
  for (var i = 0; i < data.props.length; i ++) {
    const prop = data.props[i][0];
    const value = deserialize(data.props[i][1]);
    object[prop] = value;
  }
  ObjectStore.set(data.id, object);
}

function destroyObject(data: ObjectDestroied) {
  invariant(ObjectStore.has(data.id), `[postable] Destroy failed. No such object ${data.id}`);
  ObjectStore.delete(data.id);
}

function updateObject(data: ObjectUpdated) {
  const object = ObjectStore.get(data.object);
  object[data.property] = deserialize(data.value);
}

function createMap(data: MapCreated) {
  const map = new Map();
  for (var i = 0; i < map.values.length; i ++) {
    let key = deserialize(map.values[i][0]);
    let value = deserialize(map.values[i][1]);
    map.set(key, value);
  }
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

export {
  ConstructorStore,
  ObjectStore,
  postableMessageHandler,
  ee as eventemitter
}