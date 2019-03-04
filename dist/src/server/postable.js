import { extendObservable, observe } from 'mobx';
var context = {
    worker: null
};
var __next_postable_object_id = 0;
function getNextPostableObjectID() {
    return __next_postable_object_id++;
}
function Postable(constructor) {
    var handler = {
        construct: function (target, args) {
            var obj = Object.create(constructor.prototype);
            target.apply(obj, args);
            if (!obj.hasOwnProperty('__postable_id')) {
                Object.defineProperty(target, "__postable_id", {
                    value: getNextPostableObjectID(),
                    writable: false
                });
                postObjectCreated(obj);
            }
            return obj;
        }
    };
    return new Proxy(constructor, handler);
}
function postable(target, key) {
    var _a;
    if (!target.hasOwnProperty('__postable_id')) {
        Object.defineProperty(target, "__postable_id", {
            value: getNextPostableObjectID(),
            writable: false
        });
        postObjectCreated(target);
    }
    extendObservable(target, (_a = {},
        _a[key] = target[key],
        _a));
    observe(target, key, function (change) {
        if (change.type == 'update') {
            if (typeof change.newValue == 'object') {
                var value = change.newValue;
                if (!value.hasOwnProperty('__postable_id')) {
                    Object.defineProperty(value, '__postable_id', {
                        value: getNextPostableObjectID(),
                        writable: false
                    });
                    postObjectCreated(value);
                }
            }
            postValueUpdated(target, key, change.newValue);
        }
    });
}
function postObjectCreated(object) {
    postMessage({
        type: 'object-created',
        constructor: object.constructor.name,
        id: object.__postable_id
    });
}
function postValueUpdated(object, property, value) {
    if (typeof value === 'object')
        postMessage({
            type: 'value-updated',
            object: object.__postable_id,
            property: property,
            valueType: 'object',
            value: value.__postable_id
        });
    else
        postMessage({
            type: 'value-updated',
            object: object.__postable_id,
            property: property,
            valueType: 'primitive',
            value: value
        });
}
function postMessage(message) {
    context.worker.postMessage(message);
}
function registerWorker(worker) {
    context.worker = worker;
}
export { Postable, postable, registerWorker };
//# sourceMappingURL=postable.js.map