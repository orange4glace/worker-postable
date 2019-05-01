import { IObjectDidChange } from 'mobx';
import { PostableEventBase } from 'base/common';
export declare const ObjectStore: Map<number, any>;
export declare const ConstructorStore: Map<string, any>;
export declare class PostedEvent<T> implements PostableEventBase<T> {
    fire(event: T): void;
    on: (event: T) => void;
}
export declare function Posted(name: string): (constructor: Function) => void;
export interface PostedEventListener {
    onPostableInstanceCreated?(): void;
}
export declare const postableMessageHandler: (data: any) => void;
export declare function listenable(target: any, prop: string): any;
export declare function listen(instance: any, callback: (change: IObjectDidChange) => void): void;
