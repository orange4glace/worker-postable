import { observable, observe, ObservableSet, ObservableMap } from 'mobx';
import { MessageType } from '../common/message-type';
import { invariant } from '../common/util';
var DEBUG = process.env.NODE_ENV !== "production";
var POSTABLE_PROPS = Symbol('postable_props');
var POSTABLE_FUNC_POST_CREATED = Symbol('postable_func_post_created');
var POSTABLE_FUNC_POST_DESTROIED = Symbol('postable_func_post_destroied');
var POSTABLE_ADMINISTRATOR = Symbol('postable_administrator');
var context = {
    onMessage: function () { }
};
function isObject(value) {
    return (typeof value === 'object' && value != null);
}
var __next_postable_object_id = 0;
function getNextPostableObjectID() {
    return __next_postable_object_id++;
}
function Postable /*<T extends {new(...args:any[]):{}}>*/(constructor /*:T*/) {
    asPostablePrototype(constructor.prototype);
    var handler /*:ProxyHandler<T>*/ = {
        construct: function (target, args, newTarget) {
            var instance = Reflect.construct(target, args, newTarget);
            asPostableObject(instance);
            return instance;
        }
    };
    return new Proxy(constructor, handler);
}
/*
function Postable<T extends {new(...args:any[]):{}}>(constructor:T) {
  const handler:ProxyHandler<T> = {
    construct: function(target, args) {
      let instance = Object.create(constructor.prototype);
      target.apply(instance, args);
      asPostableObject(instance);
      return instance;
    }
  }
  return new Proxy(constructor, handler)
}
*/
function postable(target, prop) {
    if (typeof target[prop] == 'function')
        return;
    asPostablePrototype(target);
    // Define property to __proto__
    target[POSTABLE_PROPS].add(prop);
    return observable(target, prop);
}
function asPostablePrototype(target) {
    if (!target.hasOwnProperty(POSTABLE_PROPS)) {
        var set = void 0;
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
        Object.defineProperty(target, POSTABLE_FUNC_POST_CREATED, {
            enumerable: false,
            writable: false,
            configurable: false,
            value: function () {
                var _this = this;
                var props = [];
                this[POSTABLE_PROPS].forEach(function (prop) {
                    var value = _this[prop];
                    if (isObject(value)) {
                        asPostableObject(value);
                        ref(value);
                    }
                    props.push([prop, serialize(value)]);
                });
                postMessage({
                    type: MessageType.OBJECT_CREATED,
                    constructor: this.constructor.name,
                    id: this[POSTABLE_ADMINISTRATOR].id,
                    props: props
                });
                this[POSTABLE_PROPS].forEach(function (prop) {
                    _this[POSTABLE_ADMINISTRATOR].observeDisposers.add(observe(_this, prop, function (change) {
                        if (change.type == 'update') {
                            var oldValue = change.oldValue;
                            if (isObject(oldValue))
                                unref(oldValue);
                            var value = change.newValue;
                            if (isObject(value)) {
                                var postable_1 = asPostableObject(value);
                                invariant(postable_1, "[postable] " + value + " is not a Postable object.");
                                ref(postable_1);
                            }
                            postMessage({
                                type: MessageType.OBJECT_UPDTAED,
                                object: _this[POSTABLE_ADMINISTRATOR].id,
                                property: prop,
                                value: serialize(value)
                            });
                        }
                    }));
                });
            }
        });
        Object.defineProperty(target, POSTABLE_FUNC_POST_DESTROIED, {
            enumerable: false,
            writable: false,
            configurable: false,
            value: function () {
                var _this = this;
                this[POSTABLE_PROPS].forEach(function (prop) {
                    var value = _this[prop];
                    if (typeof value == 'object' && value != null)
                        unref(value);
                });
                this[POSTABLE_ADMINISTRATOR].observeDisposers.forEach(function (disposer) {
                    disposer();
                });
                postMessage({
                    type: MessageType.OBJECT_DESTROIED,
                    id: this[POSTABLE_ADMINISTRATOR].id
                });
                this[POSTABLE_ADMINISTRATOR].observeDisposers.forEach(function (disposer) { return disposer(); });
                this[POSTABLE_ADMINISTRATOR].observeDisposers.clear();
            }
        });
    }
}
function asPostableObject(target) {
    if (!target.__proto__.hasOwnProperty(POSTABLE_FUNC_POST_CREATED))
        return null;
    if (target.hasOwnProperty(POSTABLE_ADMINISTRATOR))
        return target;
    Object.defineProperty(target, POSTABLE_ADMINISTRATOR, {
        enumerable: false,
        writable: false,
        configurable: false,
        value: {
            id: getNextPostableObjectID(),
            refCount: 0,
            observeDisposers: new Set()
        }
    });
    return target;
}
Object.defineProperty(Array.prototype, POSTABLE_FUNC_POST_CREATED, {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function () {
        var values = [];
        this.forEach(function (el) {
            if (isObject(el)) {
                asPostableObject(el);
                ref(el);
            }
            values.push(serialize(el));
        });
        postMessage({
            type: MessageType.ARRAY_CREATED,
            id: this[POSTABLE_ADMINISTRATOR].id,
            values: values
        });
        this[POSTABLE_ADMINISTRATOR].observeDisposers.add(observeArray(this));
    }
});
Object.defineProperty(Array.prototype, POSTABLE_FUNC_POST_DESTROIED, {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function () {
        this.forEach(function (el) {
            if (isObject(el))
                unref(el);
        });
        this[POSTABLE_ADMINISTRATOR].observeDisposers.forEach(function (disposer) {
            disposer();
        });
        postMessage({
            type: MessageType.ARRAY_DESTROIED,
            id: this[POSTABLE_ADMINISTRATOR].id
        });
        this[POSTABLE_ADMINISTRATOR].observeDisposers.forEach(function (disposer) { return disposer(); });
        this[POSTABLE_ADMINISTRATOR].observeDisposers.clear();
    }
});
Object.defineProperty(ObservableSet.prototype, POSTABLE_FUNC_POST_CREATED, {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function () {
        var values = [];
        this.forEach(function (el) {
            if (isObject(el)) {
                asPostableObject(el);
                ref(el);
            }
            values.push(serialize(el));
        });
        postMessage({
            type: MessageType.SET_CREATED,
            id: this[POSTABLE_ADMINISTRATOR].id,
            values: values
        });
        this[POSTABLE_ADMINISTRATOR].observeDisposers.add(observeSet(this));
    }
});
Object.defineProperty(ObservableSet.prototype, POSTABLE_FUNC_POST_DESTROIED, {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function () {
        this.forEach(function (el) {
            if (isObject(el))
                unref(el);
        });
        this[POSTABLE_ADMINISTRATOR].observeDisposers.forEach(function (disposer) {
            disposer();
        });
        postMessage({
            type: MessageType.SET_DESTROIED,
            id: this[POSTABLE_ADMINISTRATOR].id
        });
        this[POSTABLE_ADMINISTRATOR].observeDisposers.forEach(function (disposer) { return disposer(); });
        this[POSTABLE_ADMINISTRATOR].observeDisposers.clear();
    }
});
Object.defineProperty(ObservableMap.prototype, POSTABLE_FUNC_POST_CREATED, {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function () {
        var values = [];
        this.forEach(function (k, v) {
            if (isObject(k)) {
                asPostableObject(k);
                ref(k);
            }
            if (isObject(v)) {
                asPostableObject(v);
                ref(v);
            }
            values.push([serialize(k), serialize(v)]);
        });
        postMessage({
            type: MessageType.MAP_CREATED,
            id: this[POSTABLE_ADMINISTRATOR].id,
            values: values
        });
        this[POSTABLE_ADMINISTRATOR].observeDisposers.add(observeMap(this));
    }
});
Object.defineProperty(ObservableMap.prototype, POSTABLE_FUNC_POST_DESTROIED, {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function () {
        this.forEach(function (k, v) {
            if (isObject(k))
                unref(k);
            if (isObject(v))
                unref(v);
        });
        this[POSTABLE_ADMINISTRATOR].observeDisposers.forEach(function (disposer) {
            disposer();
        });
        postMessage({
            type: MessageType.MAP_DESTROIED,
            id: this[POSTABLE_ADMINISTRATOR].id
        });
        this[POSTABLE_ADMINISTRATOR].observeDisposers.forEach(function (disposer) { return disposer(); });
        this[POSTABLE_ADMINISTRATOR].observeDisposers.clear();
    }
});
function ref(object) {
    if (object[POSTABLE_ADMINISTRATOR].refCount == 0)
        object[POSTABLE_FUNC_POST_CREATED].call(object);
    object[POSTABLE_ADMINISTRATOR].refCount++;
}
function unref(object) {
    object[POSTABLE_ADMINISTRATOR].refCount--;
    if (object[POSTABLE_ADMINISTRATOR].refCount == 0)
        object[POSTABLE_FUNC_POST_DESTROIED].call(object);
}
function serialize(d) {
    return (isObject(d) ?
        {
            valueType: 'object',
            value: d[POSTABLE_ADMINISTRATOR].id
        } : {
        valueType: 'primitive',
        value: d
    });
}
function observeMap(data) {
    return observe(data, function (change) {
        if (change.type == 'update')
            postMapUpdate(change);
        else if (change.type == 'add')
            postMapAdd(change);
        else if (change.type == 'delete')
            postMapDelete(change);
    });
}
function postMapUpdate(c) {
    if (isObject(c.newValue)) {
        asPostableObject(c.newValue);
        ref(c.newValue);
    }
    var u = c.oldValue;
    c.type = MessageType.MAP_UPDATED;
    c.object = c.object[POSTABLE_ADMINISTRATOR].id;
    c.name = serialize(c.name);
    c.newValue = serialize(c.newValue);
    c.oldValue = serialize(c.oldValue);
    postMessage(c);
    if (isObject(u))
        unref(u);
}
function postMapAdd(c) {
    if (isObject(c.name)) {
        asPostableObject(c.name);
        ref(c.name);
    }
    if (isObject(c.newValue)) {
        asPostableObject(c.newValue);
        ref(c.newValue);
    }
    c.type = MessageType.MAP_ADDED;
    c.object = c.object[POSTABLE_ADMINISTRATOR].id;
    c.name = serialize(c.name);
    c.newValue = serialize(c.newValue);
    postMessage(c);
}
function postMapDelete(c) {
    c.type = MessageType.MAP_DELETED;
    c.object = c.object[POSTABLE_ADMINISTRATOR].id;
    c.name = serialize(c.name);
    c.oldValue = serialize(c.oldValue);
    postMessage(c);
    if (isObject(c.oldValue))
        unref(c.oldValue);
    if (isObject(c.name))
        unref(c.name);
}
function observeSet(data) {
    return observe(data, function (change) {
        if (change.type == 'add')
            postSetAdd(change);
        if (change.type == 'delete')
            postSetDelete(change);
    });
}
function postSetAdd(c) {
    if (isObject(c.newValue)) {
        asPostableObject(c.newValue);
        ref(c.newValue);
    }
    c.type = MessageType.SET_ADDED;
    c.object = c.object[POSTABLE_ADMINISTRATOR].id;
    c.newValue = serialize(c.newValue);
    postMessage(c);
}
function postSetDelete(c) {
    c.type = MessageType.SET_DELETED;
    c.object = c.object[POSTABLE_ADMINISTRATOR].id;
    c.oldValue = serialize(c.oldvalue);
    postMessage(c);
    if (isObject(c.oldValue))
        unref(c.oldValue);
}
function observeArray(data) {
    return observe(data, function (change) {
        if (change.type == 'update')
            postArrayUpdate(change);
        else if (change.type == 'splice')
            postArraySplice(change);
    });
}
function postArrayUpdate(c) {
    if (isObject(c.newValue)) {
        asPostableObject(c.newValue);
        ref(c.newValue);
    }
    var u = c.oldValue;
    c.type = MessageType.ARRAY_UPDATED;
    c.object = c.object[POSTABLE_ADMINISTRATOR].id;
    c.newValue = serialize(c.newValue);
    c.oldValue = serialize(c.oldValue);
    postMessage(c);
    if (isObject(u))
        unref(u);
}
function postArraySplice(c) {
    c.type = MessageType.ARRAY_SPLICED;
    c.object = c.object[POSTABLE_ADMINISTRATOR].id;
    c.added = c.added.map(function (d) {
        if (isObject(d)) {
            asPostableObject(d);
            ref(d);
        }
        serialize(d);
    });
    var unrefs = [];
    c.removed = c.removed.map(function (d) {
        if (isObject(d))
            unrefs.push(d);
        serialize(d);
    });
    postMessage(c);
    unrefs.forEach(function (u) { return unref(u); });
}
function postMessage(message) {
    context.onMessage(message);
}
function getPostableID(object) {
    return object[POSTABLE_ADMINISTRATOR].id;
}
export { Postable, postable, ref, unref, getPostableID, context };
//# sourceMappingURL=postable.js.map