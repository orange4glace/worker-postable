var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { MessageType } from '../base/message-type';
import { observable, observe, ObservableSet, ObservableMap } from 'mobx';
import { assert } from 'base/common/assert';
var POSTABLE_PROPS = Symbol('postable_props');
var POSTABLE_ID = Symbol('postable_id');
var POSTABLE_ADMINISTRATOR = Symbol('postable_administrator');
export var ObjectStore = new Map();
export var ConstructorStore = new Map();
function getObject(id) {
    var obj = ObjectStore.get(id);
    assert(obj, 'Object not exists. ' + id);
    return obj;
}
function onServerEvent(data) {
    var event = getObject(data.object);
    event.fire(data.event);
}
var PostedEvent = /** @class */ (function () {
    function PostedEvent() {
    }
    PostedEvent.prototype.fire = function (event) {
        if (this.on)
            this.on(event);
    };
    PostedEvent = __decorate([
        Posted('PostableEvent')
    ], PostedEvent);
    return PostedEvent;
}());
export { PostedEvent };
export function Posted(name) {
    return function (constructor) {
        ConstructorStore.set(name, constructor);
    };
}
export function posted(self, prop) {
}
export var postableMessageHandler = function (data) {
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
};
function deserialize(d) {
    if (d.valueType == 'primitive')
        return d.value;
    return ObjectStore.get(d.value);
}
var PostableAdministrator = /** @class */ (function () {
    function PostableAdministrator(instance) {
        this.reactions = new Set();
    }
    PostableAdministrator.prototype.addReaction = function (reaction) {
        this.reactions.add(reaction);
    };
    PostableAdministrator.prototype.removeReaction = function (reaction) {
        assert(this.reactions.has(reaction), '[postable] no reaction exists');
        reaction();
        this.reactions.delete(reaction);
    };
    PostableAdministrator.prototype.destroy = function () {
        this.reactions.forEach(function (reaction) { return reaction(); });
    };
    return PostableAdministrator;
}());
var ObjectPostableAdministrator = /** @class */ (function (_super) {
    __extends(ObjectPostableAdministrator, _super);
    function ObjectPostableAdministrator(instance, props) {
        var _this = _super.call(this, instance) || this;
        var values = {};
        props.forEach(function (prop) {
            values[prop] = instance[prop];
        });
        _this.values = observable(values);
        return _this;
    }
    return ObjectPostableAdministrator;
}(PostableAdministrator));
var ContainerPostableAdministrator = /** @class */ (function (_super) {
    __extends(ContainerPostableAdministrator, _super);
    function ContainerPostableAdministrator() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ContainerPostableAdministrator;
}(PostableAdministrator));
export function listenable(target, prop) {
    asListenableProptotype(target);
    return addPostableProp(target, prop);
}
export function listen(instance, callback) {
    asListenableObject(instance);
    var disposer;
    var admin = instance[POSTABLE_ADMINISTRATOR];
    if (admin.hasOwnProperty('values'))
        disposer = observe(admin.values, callback);
    else
        disposer = observe(instance, callback);
    admin.addReaction(disposer);
}
function asListenableProptotype(target) {
    if (target.hasOwnProperty(POSTABLE_PROPS))
        return;
    var set;
    if (target.__proto__.hasOwnProperty(POSTABLE_PROPS))
        set = new Set(target.__proto__[POSTABLE_PROPS]);
    else
        set = new Set();
    Object.defineProperty(target, POSTABLE_PROPS, {
        enumerable: false,
        writable: true,
        configurable: true,
        value: set
    });
}
function addPostableProp(target, prop) {
    return {
        enumerable: true,
        configurable: true,
        get: function () {
            asListenableObject(this);
            redefineProperty(this, prop);
            return this[prop];
        },
        set: function (value) {
            asListenableObject(this);
            redefineProperty(this, prop);
            this[prop] = value;
        }
    };
}
function redefineProperty(instance, prop) {
    delete instance[prop];
    Object.defineProperty(instance, prop, {
        get: function () {
            return instance[POSTABLE_ADMINISTRATOR].values[prop];
        },
        set: function (value) {
            if (typeof value != 'object') {
                instance[POSTABLE_ADMINISTRATOR].values[prop] = value;
                return;
            }
            instance[POSTABLE_ADMINISTRATOR].values[prop] = value;
            var postableID = value[POSTABLE_ID];
            var v = instance[POSTABLE_ADMINISTRATOR].values[prop];
            ObjectStore.set(postableID, v);
        }
    });
}
function asListenableObject(instance) {
    if (instance.hasOwnProperty(POSTABLE_ADMINISTRATOR))
        return;
    if (instance instanceof ObservableSet ||
        instance instanceof ObservableMap ||
        Array.isArray(instance)) {
        Object.defineProperty(instance, POSTABLE_ADMINISTRATOR, {
            configurable: false,
            enumerable: false,
            value: new ContainerPostableAdministrator(instance)
        });
        return;
    }
    var props = instance[POSTABLE_PROPS];
    Object.defineProperty(instance, POSTABLE_ADMINISTRATOR, {
        configurable: false,
        enumerable: false,
        value: new ObjectPostableAdministrator(instance, props)
    });
}
function createObject(data) {
    var constructor = ConstructorStore.get(data.constructor);
    assert(constructor, "[postable] " + data.constructor + " not exist");
    var object = new constructor();
    for (var i = 0; i < data.props.length; i++) {
        var prop = data.props[i][0];
        var value = deserialize(data.props[i][1]);
        object[prop] = value;
    }
    if (typeof object.onPostableInstanceCreated == 'function')
        object.onPostableInstanceCreated();
    Object.defineProperty(object, POSTABLE_ID, { value: data.id });
    ObjectStore.set(data.id, object);
}
function destroyObject(data) {
    assert(ObjectStore.has(data.id), "[postable] Destroy failed. No such object " + data.id);
    ObjectStore.delete(data.id);
}
function updateObject(data) {
    var object = ObjectStore.get(data.object);
    object[data.property] = deserialize(data.value);
}
function createMap(data) {
    var map = new Map();
    for (var i = 0; i < map.values.length; i++) {
        var key = deserialize(map.values[i][0]);
        var value = deserialize(map.values[i][1]);
        map.set(key, value);
    }
    Object.defineProperty(map, POSTABLE_ID, { value: data.id });
    ObjectStore.set(data.id, map);
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
function createSet(data) {
    var set = new Set();
    data.values.forEach(function (v) {
        var value = deserialize(v);
        set.add(value);
    });
    Object.defineProperty(set, POSTABLE_ID, { value: data.id });
    ObjectStore.set(data.id, set);
}
function addSet(data) {
    var object = ObjectStore.get(data.object);
    object.add(deserialize(data.newValue));
}
function deleteSet(data) {
    var object = ObjectStore.get(data.object);
    object.delete(deserialize(data.oldValue));
}
function createArray(data) {
    var array = new Array();
    data.values.forEach(function (v) {
        var value = deserialize(v);
        array.push(value);
    });
    Object.defineProperty(array, POSTABLE_ID, { value: data.id });
    ObjectStore.set(data.id, array);
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
//# sourceMappingURL=client.js.map