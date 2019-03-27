import { EventEmitter2 } from 'eventemitter2';
import { IObjectDidChange } from 'mobx';
declare const ObjectStore: Map<number, any>;
declare const ConstructorStore: Map<string, any>;
declare const ee: EventEmitter2;
export declare function Posted(name: string): (constructor: Function) => void;
declare const postableMessageHandler: (data: any) => void;
export declare function listenable(target: any, prop: string): any;
export declare function listen(instance: any, callback: (change: IObjectDidChange) => void): void;
export { ConstructorStore, ObjectStore, postableMessageHandler, ee as eventemitter };
