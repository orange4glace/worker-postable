import { EventEmitter2 } from 'eventemitter2';
declare const ObjectStore: Map<number, any>;
declare const ConstructorStore: Map<string, any>;
declare const ee: EventEmitter2;
declare const postableMessageHandler: (msg: any) => void;
export { ConstructorStore, ObjectStore, postableMessageHandler, ee as eventemitter };
