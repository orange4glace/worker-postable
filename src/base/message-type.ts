import { postable_object_id_t } from './type_t'

enum MessageType {
  OBJECT_CREATED = 1,
  ARRAY_CREATED,
  SET_CREATED,
  MAP_CREATED,
  OBJECT_DESTROIED,
  ARRAY_DESTROIED,
  SET_DESTROIED,
  MAP_DESTROIED,
  OBJECT_UPDTAED,
  MAP_UPDATED,
  MAP_ADDED,
  MAP_DELETED,
  SET_ADDED,
  SET_DELETED,
  ARRAY_UPDATED,
  ARRAY_SPLICED,
  SERVER_EVENT,
}

interface ObjectCreated {
  type: number,
  constructor: string,
  id: postable_object_id_t,
  props: any[]
}

interface ObjectUpdated {
  type: number,
  object: postable_object_id_t,
  property: string,
  value: postable_object_id_t | number | string | boolean | null | undefined
}

interface ObjectDestroied {
  type: number,
  id: postable_object_id_t
}

interface ArrayCreated {
  type: number,
  id: postable_object_id_t,
  values: any[]
}

interface SetCreated {
  type: number,
  id: postable_object_id_t,
  values: any[]
}

interface MapCreated {
  type: number,
  id: postable_object_id_t,
  values: any[]
}

interface MapUpdated {
  type: number,
  object: postable_object_id_t,
  name: string,
  newValue: any,
  oldValue: any
}

interface MapAdded {
  type: number,
  object: postable_object_id_t,
  name: string,
  newValue: any
}

interface MapDeleted {
  type: number,
  object: postable_object_id_t,
  name: string,
  oldValue: any
}

interface SetAdded {
  type: number,
  object: postable_object_id_t,
  newValue: any,
}

interface SetDelete {
  type: number,
  object: postable_object_id_t,
  oldValue: any,
}

interface ArrayUpdated {
  type: number,
  object: postable_object_id_t,
  index: number,
  newValue: any,
  oldValue: any
}

interface ArraySpliced {
  type: number,
  object: postable_object_id_t,
  index: number,
  added: any[],
  addedCount: number,
  removed: any[]
  removedCount: number
}

interface ServerEvent<T> {
  type: number,
  object: postable_object_id_t,
  event: T
}

export {
  MessageType,
  ObjectCreated,
  ObjectUpdated,
  ObjectDestroied,
  ArrayCreated,
  SetCreated,
  MapCreated,
  MapUpdated,
  MapAdded,
  MapDeleted,
  SetAdded,
  SetDelete,
  ArrayUpdated,
  ArraySpliced,
  ServerEvent
}