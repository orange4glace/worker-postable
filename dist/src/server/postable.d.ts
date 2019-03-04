declare function Postable<T extends {
    new (...args: any[]): {};
}>(constructor: T): T;
declare function postable(target: any, key: string): void;
declare function registerWorker(worker: Worker): void;
export { Postable, postable, registerWorker };
