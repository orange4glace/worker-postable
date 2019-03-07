import { postable_object_id_t } from '../common/type_t'
import { ObjectCreated, ValueUpdated } from '../common/message-type'

import { EventEmitter2 } from 'eventemitter2'

const ObjectStore = new Map<postable_object_id_t, any>();
const ConstructorStore = new Map<string, any>();
const ee = new EventEmitter2();

ConstructorStore.set('Array', Array.prototype.constructor);
ConstructorStore.set('ObservableSet$$1', Set.prototype.constructor);
ConstructorStore.set('ObservableMap$$1', Map.prototype.constructor);

const postableMessageHandler = function (msg) {
  console.log(msg);
  const data = msg.data;
  switch (data.type) {
    case 'object-created':
      createObject(data);
      break;
    case 'object-updated':
      updateObject(data);
      break;
    case 'map-update':
      updateMap(data);
      break;
    case 'map-add':
      addMap(data);
      break;
    case 'map-delete':
      deleteMap(data);
      break;
    case 'set-add':
      addSet(data);
      break;
    case 'set-delete':
      deleteSet(data);
      break;
    case 'array-update':
      updateArray(data);
      break;
    case 'array-splice':
      spliceArray(data);
      break;
  }
  ee.emit('message', data);
}

function deserialize(d) {
  if (d.valueType == 'primitive') return d.value;
  return ObjectStore.get(d.value);
}

function createObject(data: ObjectCreated) {
  const constructor = ConstructorStore.get(data.constructor);
  const object = new constructor();
  ObjectStore.set(data.id, object);
  ee.emit('object-created', {
    id: data.id,
    type: data.constructor,
    object: object
  });
}

function updateObject(data: ValueUpdated) {
  const object = ObjectStore.get(data.object);
  object[data.property] = deserialize(data.value);
}

function updateMap(data: any) {
  const object: Map<any, any> = ObjectStore.get(data.object);
  object.set(
    deserialize(data.name),
    deserialize(data.newValue))
}

function addMap(data: any) {
  const object: Map<any, any> = ObjectStore.get(data.object);
  object.set(
    deserialize(data.name),
    deserialize(data.newValue))
}

function deleteMap(data: any) {
  const object: Map<any, any> = ObjectStore.get(data.object);
  object.delete(
    deserialize(data.name))
}

function addSet(data: any) {
  const object: Set<any> = ObjectStore.get(data.object);
  object.add(deserialize(data.newValue))
}

function deleteSet(data: any) {
  const object: Set<any> = ObjectStore.get(data.object);
  object.delete(deserialize(data.newValue))
}

function updateArray(data: any) {
  const object: Array<any> = ObjectStore.get(data.object);
  object[data.index] = deserialize(data.newValue);
}

function spliceArray(data: any) {
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