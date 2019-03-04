declare const ObjectStore: Map<number, Object>;
declare const ConstructorStore: Map<string, any>;
declare const postableMessageHandler: (msg: any) => void;
export { ConstructorStore, ObjectStore, postableMessageHandler };
