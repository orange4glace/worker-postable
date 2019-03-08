interface Context {
    onMesssage: (message: any) => void;
}
declare let context: Context;
declare function Postable<T extends {
    new (...args: any[]): {};
}>(constructor: T): T;
declare function postable(target: any, prop: string): any;
declare function ref(object: any): void;
declare function unref(object: any): void;
export { Postable, postable, ref, unref, context };
