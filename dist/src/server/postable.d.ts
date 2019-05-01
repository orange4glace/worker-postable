import { PostableEventBase } from 'base/common';
interface Context {
    onMessage: (message: any) => void;
}
export declare const context: Context;
export declare class PostableEvent<T> implements PostableEventBase<T> {
    emit(event: T): void;
}
export declare function Postable(constructor: any): void;
export declare function postable(target: any, prop: string): any;
export declare function ref(object: any): void;
export declare function unref(object: any): void;
export declare function getPostableID(object: any): any;
export {};
