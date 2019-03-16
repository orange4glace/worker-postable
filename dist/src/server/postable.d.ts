interface Context {
    onMessage: (message: any) => void;
}
declare let context: Context;
declare function Postable(constructor: any): any;
declare function postable(target: any, prop: string): any;
declare function ref(object: any): void;
declare function unref(object: any): void;
declare function getPostableID(object: any): any;
export { Postable, postable, ref, unref, getPostableID, context };
