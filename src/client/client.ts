import { postable_object_id_t } from 'common/type_t'
import { ObjectCreated, ValueUpdated } from 'common/message-type'

const ObjectStore = new Map<postable_object_id_t, Object>();
const ConstructorStore = new Map<string, any>();

self.onmessage = function (msg) {
  const data = msg.data;
  switch (data.type) {
    case 'object-created':
      createObject(data);
      break;
    case 'value-updated':
      updateValue(data);
      break;
  }
}

function createObject(data: ObjectCreated) {
  const constructor = ConstructorStore[data.constructor];
  const object = constructor();
  ObjectStore.set(data.id, object);
}

function updateValue(data: ValueUpdated) {
  const object = ObjectStore.get(data.object);
  console.assert(object);
  if (data.valueType == 'object') {
    const value = ObjectStore.get((data.value as postable_object_id_t));
    console.assert(value);
    object[data.property] = value;
  }
  else object[data.property] = data.value;
}