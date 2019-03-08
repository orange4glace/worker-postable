var MessageType;
(function (MessageType) {
    MessageType[MessageType["OBJECT_CREATED"] = 1] = "OBJECT_CREATED";
    MessageType[MessageType["ARRAY_CREATED"] = 2] = "ARRAY_CREATED";
    MessageType[MessageType["SET_CREATED"] = 3] = "SET_CREATED";
    MessageType[MessageType["MAP_CREATED"] = 4] = "MAP_CREATED";
    MessageType[MessageType["OBJECT_DESTROIED"] = 5] = "OBJECT_DESTROIED";
    MessageType[MessageType["ARRAY_DESTROIED"] = 6] = "ARRAY_DESTROIED";
    MessageType[MessageType["SET_DESTROIED"] = 7] = "SET_DESTROIED";
    MessageType[MessageType["MAP_DESTROIED"] = 8] = "MAP_DESTROIED";
    MessageType[MessageType["OBJECT_UPDTAED"] = 9] = "OBJECT_UPDTAED";
    MessageType[MessageType["MAP_UPDATED"] = 10] = "MAP_UPDATED";
    MessageType[MessageType["MAP_ADDED"] = 11] = "MAP_ADDED";
    MessageType[MessageType["MAP_DELETED"] = 12] = "MAP_DELETED";
    MessageType[MessageType["SET_ADDED"] = 13] = "SET_ADDED";
    MessageType[MessageType["SET_DELETED"] = 14] = "SET_DELETED";
    MessageType[MessageType["ARRAY_UPDATED"] = 15] = "ARRAY_UPDATED";
    MessageType[MessageType["ARRAY_SPLICED"] = 16] = "ARRAY_SPLICED";
})(MessageType || (MessageType = {}));
export { MessageType };
//# sourceMappingURL=message-type.js.map