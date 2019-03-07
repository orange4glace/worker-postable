import { EventEmitter2 } from 'eventemitter2';
var ObjectStore = new Map();
var ConstructorStore = new Map();
var ee = new EventEmitter2();
ConstructorStore.set('Array', Array.prototype.constructor);
ConstructorStore.set('ObservableSet$$1', Set.prototype.constructor);
ConstructorStore.set('ObservableMap$$1', Map.prototype.constructor);
var postableMessageHandler = function (msg) {
    console.log(msg);
    var data = msg.data;
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
};
function deserialize(d) {
    if (d.valueType == 'primitive')
        return d.value;
    return ObjectStore.get(d.value);
}
function createObject(data) {
    var constructor = ConstructorStore.get(data.constructor);
    var object = new constructor();
    ObjectStore.set(data.id, object);
    ee.emit('object-created', {
        id: data.id,
        type: data.constructor,
        object: object
    });
}
function updateObject(data) {
    var object = ObjectStore.get(data.object);
    object[data.property] = deserialize(data.value);
}
function updateMap(data) {
    var object = ObjectStore.get(data.object);
    object.set(deserialize(data.name), deserialize(data.newValue));
}
function addMap(data) {
    var object = ObjectStore.get(data.object);
    object.set(deserialize(data.name), deserialize(data.newValue));
}
function deleteMap(data) {
    var object = ObjectStore.get(data.object);
    object.delete(deserialize(data.name));
}
function addSet(data) {
    var object = ObjectStore.get(data.object);
    object.add(deserialize(data.newValue));
}
function deleteSet(data) {
    var object = ObjectStore.get(data.object);
    object.delete(deserialize(data.newValue));
}
function updateArray(data) {
    var object = ObjectStore.get(data.object);
    object[data.index] = deserialize(data.newValue);
}
function spliceArray(data) {
    var object = ObjectStore.get(data.object);
    data.added = data.added.map(function (d) { return deserialize(d); });
    object.splice(data.index, data.removedCount, data.added);
}
export { ConstructorStore, ObjectStore, postableMessageHandler, ee as eventemitter };
//# sourceMappingURL=client.js.map