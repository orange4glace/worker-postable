import { postable_object_id_t } from '../common/type_t'

interface ObjectCreated {
  type: string,
  constructor: string,
  id: postable_object_id_t
}

interface ValueUpdated {
  type: string,
  object: postable_object_id_t,
  property: string,
  valueType: string,
  value: postable_object_id_t | number | string | boolean | null | undefined
}

export {
  ObjectCreated,
  ValueUpdated
}