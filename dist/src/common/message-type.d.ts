import { postable_object_id_t } from '../common/type_t';
declare enum MessageType {
    OBJECT_CREATED = 1,
    ARRAY_CREATED = 2,
    SET_CREATED = 3,
    MAP_CREATED = 4,
    OBJECT_DESTROIED = 5,
    ARRAY_DESTROIED = 6,
    SET_DESTROIED = 7,
    MAP_DESTROIED = 8,
    OBJECT_UPDTAED = 9,
    MAP_UPDATED = 10,
    MAP_ADDED = 11,
    MAP_DELETED = 12,
    SET_ADDED = 13,
    SET_DELETED = 14,
    ARRAY_UPDATED = 15,
    ARRAY_SPLICED = 16
}
interface ObjectCreated {
    type: number;
    constructor: string;
    id: postable_object_id_t;
    props: any[];
}
interface ObjectUpdated {
    type: number;
    object: postable_object_id_t;
    property: string;
    value: postable_object_id_t | number | string | boolean | null | undefined;
}
interface ObjectDestroied {
    type: number;
    id: postable_object_id_t;
}
interface ArrayCreated {
    type: number;
    id: postable_object_id_t;
    values: any[];
}
interface SetCreated {
    type: number;
    id: postable_object_id_t;
    values: any[];
}
interface MapCreated {
    type: number;
    id: postable_object_id_t;
    values: any[];
}
interface MapUpdated {
    type: number;
    object: postable_object_id_t;
    name: string;
    newValue: any;
    oldValue: any;
}
interface MapAdded {
    type: number;
    object: postable_object_id_t;
    name: string;
    newValue: any;
}
interface MapDeleted {
    type: number;
    object: postable_object_id_t;
    name: string;
    oldValue: any;
}
interface SetAdded {
    type: number;
    object: postable_object_id_t;
    newValue: any;
}
interface SetDelete {
    type: number;
    object: postable_object_id_t;
    oldValue: any;
}
interface ArrayUpdated {
    type: number;
    object: postable_object_id_t;
    index: number;
    newValue: any;
    oldValue: any;
}
interface ArraySpliced {
    type: number;
    object: postable_object_id_t;
    index: number;
    added: any[];
    addedCount: number;
    removed: any[];
    removedCount: number;
}
export { MessageType, ObjectCreated, ObjectUpdated, ObjectDestroied, ArrayCreated, SetCreated, MapCreated, MapUpdated, MapAdded, MapDeleted, SetAdded, SetDelete, ArrayUpdated, ArraySpliced };
