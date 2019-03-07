import { observable, observe, ObservableSet, ObservableMap } from 'mobx';
var DEBUG = process.env.NODE_ENV !== "production";
var POSTABLE_ID_SYMBOL = Symbol('postable_id');
var POSTABLE_REF_COUNT = Symbol('postable_ref_count');
var POSTABLE_PROPS = Symbol('postable_props');
var POSTABLE_OBSERVE_DISPOSERS = Symbol('postable_observe_disposers');
var POSTABLE_FUNC_POST_CREATED = Symbol('postable_func_post_created');
var POSTABLE_FUNC_POST_DESTROIED = Symbol('postable_func_post_destroied');
export var OBFUSCATED_ERROR = "An invariant failed, however the error is obfuscated because this is an production build.";
function invariant(check, message) {
    if (!check)
        throw new Error("[mobx] " + (message || OBFUSCATED_ERROR));
}
var context = {
    onMesssage: function () { }
};
function isObject(value) {
    return (typeof value === 'object' && value != null);
}
var __next_postable_object_id = 0;
function getNextPostableObjectID() {
    return __next_postable_object_id++;
}
function Postable(constructor) {
    var handler = {
        construct: function (target, args) {
            var instance = Object.create(constructor.prototype);
            target.apply(instance, args);
            asPostableObject(instance);
            return instance;
        }
    };
    return new Proxy(constructor, handler);
}
function postable(target, prop) {
    // Define property to __proto__
    if (!target.hasOwnProperty(POSTABLE_PROPS)) {
        Object.defineProperty(target, POSTABLE_PROPS, {
            enumerable: false,
            writable: true,
            configurable: true,
            value: new Set()
        });
        Object.defineProperty(target, POSTABLE_FUNC_POST_CREATED, {
            enumerable: false,
            writable: false,
            configurable: false,
            value: function () {
                var _this = this;
                var props = {};
                this[POSTABLE_PROPS].forEach(function (prop) {
                    var value = _this[prop];
                    if (isObject(value)) {
                        asPostableObject(value);
                        ref(value);
                    }
                    props[prop] = serialize(value);
                });
                postMessage({
                    type: 'object-created',
                    constructor: this.constructor.name,
                    id: this[POSTABLE_ID_SYMBOL],
                    props: props
                });
                this[POSTABLE_PROPS].forEach(function (prop) {
                    _this[POSTABLE_OBSERVE_DISPOSERS].add(observe(_this, prop, function (change) {
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
                                type: 'object-updated',
                                object: _this[POSTABLE_ID_SYMBOL],
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
                this[POSTABLE_OBSERVE_DISPOSERS].forEach(function (disposer) {
                    disposer();
                });
                postMessage({
                    type: 'object-destroied',
                    id: this[POSTABLE_ID_SYMBOL]
                });
                this[POSTABLE_OBSERVE_DISPOSERS].forEach(function (disposer) { return disposer(); });
                this[POSTABLE_OBSERVE_DISPOSERS].clear();
            }
        });
    }
    target[POSTABLE_PROPS].add(prop);
    return observable(target, prop);
}
Object.defineProperty(Array.prototype, POSTABLE_FUNC_POST_CREATED, {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function () {
        var values = [];
        this.forEach(function (el) {
            if (isObject(el))
                ref(el);
            values.push(serialize(el));
        });
        postMessage({
            type: 'object-created',
            constructor: this.constructor.name,
            id: this[POSTABLE_ID_SYMBOL],
            values: values
        });
        this[POSTABLE_OBSERVE_DISPOSERS].add(observeArray(this));
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
        this[POSTABLE_OBSERVE_DISPOSERS].forEach(function (disposer) {
            disposer();
        });
        postMessage({
            type: 'object-destroied',
            id: this[POSTABLE_ID_SYMBOL]
        });
        this[POSTABLE_OBSERVE_DISPOSERS].forEach(function (disposer) { return disposer(); });
        this[POSTABLE_OBSERVE_DISPOSERS].clear();
    }
});
Object.defineProperty(ObservableSet.prototype, POSTABLE_FUNC_POST_CREATED, {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function () {
        var values = [];
        this.forEach(function (el) {
            if (isObject(el))
                ref(el);
            values.push(serialize(el));
        });
        postMessage({
            type: 'object-created',
            constructor: this.constructor.name,
            id: this[POSTABLE_ID_SYMBOL],
            values: values
        });
        this[POSTABLE_OBSERVE_DISPOSERS].add(observeSet(this));
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
        this[POSTABLE_OBSERVE_DISPOSERS].forEach(function (disposer) {
            disposer();
        });
        postMessage({
            type: 'object-destroied',
            id: this[POSTABLE_ID_SYMBOL]
        });
        this[POSTABLE_OBSERVE_DISPOSERS].forEach(function (disposer) { return disposer(); });
        this[POSTABLE_OBSERVE_DISPOSERS].clear();
    }
});
Object.defineProperty(ObservableMap.prototype, POSTABLE_FUNC_POST_CREATED, {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function () {
        var values = [];
        this.forEach(function (k, v) {
            if (isObject(v))
                ref(v);
            if (isObject(k))
                ref(k);
            values.push([serialize(k), serialize(v)]);
        });
        postMessage({
            type: 'object-created',
            constructor: this.constructor.name,
            id: this[POSTABLE_ID_SYMBOL],
            values: values
        });
        this[POSTABLE_OBSERVE_DISPOSERS].add(observeMap(this));
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
        this[POSTABLE_OBSERVE_DISPOSERS].forEach(function (disposer) {
            disposer();
        });
        postMessage({
            type: 'object-destroied',
            id: this[POSTABLE_ID_SYMBOL]
        });
        this[POSTABLE_OBSERVE_DISPOSERS].forEach(function (disposer) { return disposer(); });
        this[POSTABLE_OBSERVE_DISPOSERS].clear();
    }
});
function asPostableObject(target) {
    if (!target.__proto__.hasOwnProperty(POSTABLE_FUNC_POST_CREATED))
        return null;
    if (target.hasOwnProperty(POSTABLE_ID_SYMBOL))
        return target;
    Object.defineProperty(target, POSTABLE_ID_SYMBOL, {
        enumerable: false,
        writable: false,
        configurable: false,
        value: getNextPostableObjectID()
    });
    Object.defineProperty(target, POSTABLE_REF_COUNT, {
        enumerable: false,
        writable: true,
        configurable: false,
        value: 0
    });
    Object.defineProperty(target, POSTABLE_OBSERVE_DISPOSERS, {
        enumerable: false,
        writable: false,
        configurable: false,
        value: new Set()
    });
    return target;
}
function ref(object) {
    if (object[POSTABLE_REF_COUNT] == 0)
        object[POSTABLE_FUNC_POST_CREATED].call(object);
    object[POSTABLE_REF_COUNT]++;
}
function unref(object) {
    object[POSTABLE_REF_COUNT]--;
    if (object[POSTABLE_REF_COUNT] == 0)
        object[POSTABLE_FUNC_POST_DESTROIED].call(object);
}
function serialize(d) {
    return (typeof d == 'object' ?
        {
            valueType: 'object',
            value: d[POSTABLE_ID_SYMBOL]
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
    if (isObject(c.newValue))
        ref(c.newValue);
    if (isObject(c.oldValue))
        unref(c.oldValue);
    c.type = 'map-update';
    c.object = c.object[POSTABLE_ID_SYMBOL];
    c.name = serialize(c.name);
    c.newValue = serialize(c.newValue);
    c.oldValue = serialize(c.oldValue);
    postMessage(c);
}
function postMapAdd(c) {
    if (isObject(c.newValue))
        ref(c.newValue);
    c.type = 'map-add';
    c.object = c.object[POSTABLE_ID_SYMBOL];
    c.name = serialize(c.name);
    c.newValue = serialize(c.newValue);
    postMessage(c);
}
function postMapDelete(c) {
    if (isObject(c.oldValue))
        unref(c.oldValue);
    c.type = 'map-delete';
    c.object = c.object[POSTABLE_ID_SYMBOL];
    c.name = serialize(c.name);
    c.oldValue = serialize(c.oldValue);
    postMessage(c);
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
    if (isObject(c.newValue))
        ref(c.newValue);
    c.type = 'set-add';
    c.object = c.object[POSTABLE_ID_SYMBOL];
    c.newValue = serialize(c.newValue);
    postMessage(c);
}
function postSetDelete(c) {
    if (isObject(c.oldValue))
        unref(c.oldValue);
    c.type = 'set-delete';
    c.object = c.object[POSTABLE_ID_SYMBOL];
    c.oldValue = serialize(c.oldvalue);
    postMessage(c);
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
    if (isObject(c.newValue))
        ref(c.newValue);
    if (isObject(c.oldValue))
        unref(c.oldValue);
    c.type = 'array-update';
    c.object = c.object[POSTABLE_ID_SYMBOL];
    c.newValue = serialize(c.newValue);
    c.oldValue = serialize(c.oldValue);
    postMessage(c);
}
function postArraySplice(c) {
    c.type = 'array-splice';
    c.object = c.object[POSTABLE_ID_SYMBOL];
    c.added = c.added.map(function (d) {
        if (isObject(d))
            ref(d);
        serialize(d);
    });
    c.removed = c.removed.map(function (d) {
        if (isObject(d))
            unref(d);
        serialize(d);
    });
    postMessage(c);
}
function postMessage(message) {
    context.onMesssage(message);
}
export { Postable, postable, ref, unref, context };
//# sourceMappingURL=postable.js.map