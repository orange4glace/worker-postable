var ObjectStore = new Map();
var ConstructorStore = new Map();
ConstructorStore.set('Array', Array.prototype.constructor);
ConstructorStore.set('Set', Set.prototype.constructor);
ConstructorStore.set('Map', Map.prototype.constructor);
var postableMessageHandler = function (msg) {
    var data = msg.data;
    switch (data.type) {
        case 'object-created':
            createObject(data);
            break;
        case 'value-updated':
            updateValue(data);
            break;
    }
};
function createObject(data) {
    var constructor = ConstructorStore.get(data.constructor);
    var object = new constructor();
    ObjectStore.set(data.id, object);
}
function updateValue(data) {
    var object = ObjectStore.get(data.object);
    console.assert(object);
    if (data.valueType == 'object') {
        var value = ObjectStore.get(data.value);
        console.assert(value);
        object[data.property] = value;
    }
    else
        object[data.property] = data.value;
}
export { ConstructorStore, ObjectStore, postableMessageHandler };
//# sourceMappingURL=client.js.map