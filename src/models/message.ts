import {FileDataOut} from "./file";

export enum messageTypes {
    normalMessage = 0,
    statusMessage = 1
}
export enum statusMessageTypes {
    chatCreated,
    usersAdded,
    usersRemoved,
    usersJoined,
    usersLeft,
    usersMadeAdmin,
    usersRemovedAdmin,
    /*
        when user resigns from admin status
     */
    userResignedAdmin,
    chatNameChanged,
    descriptionChanged,
    isPublicChanged
}
export interface NewMessageData {
    chatType: string,
    chatId: number,
    message: MessageDataIn
}
// type check
export function instanceOfNewMessageData(object: any): object is NewMessageData {
    if(!(
        typeof object === 'object'
        && 'chatType' in object && typeof object.chatType === 'string'
        && 'chatId' in object && typeof object.chatId === 'number'
        && 'message' in object && typeof object.message === 'object'
        && instanceOfMessageDataIn(object.message)
    ))
        throw new TypeError('invalid NewMessageData');
    return true;
}
export interface NewMessageReturn {
    mid: number
}
// type check
export function instanceOfNewMessageReturn(object: any): object is NewMessageReturn {
    if(!(
        typeof object === 'object'
        && 'mid' in object && typeof object.mid === 'number'
    ))
        throw new TypeError('invalid NewMessageReturn');
    return true;
}
export interface MessageDataIn {
    type: messageTypes,
    content: MessageContentIn
}
// type check
export function instanceOfMessageDataIn(object: any): object is MessageDataIn {
    if(!(
        typeof object === 'object'
        && 'type' in object && typeof object.type === 'number'
        && 'content' in object && typeof object.content === 'object'
        && instanceOfMessageContentIn(object.content)
    ))
        throw new TypeError('invalid MessageDataIn');
    return true;
}
export interface NewestMessage {
    empty: boolean,
    canBeShown: boolean,
    uid?: number,
    mid?: number,
    date?: string,
    type?: messageTypes,
    content?: MessageContentOut
}
export interface MessageDataOut {
    // the id of the user who wrote the message
    uid: number,
    mid: number,
    date: string,
    type: messageTypes,
    content: MessageContentOut
}
// type check
export function instanceOfMessageDataOut(object: any): object is MessageDataOut {
    if(!(
        typeof object === 'object'
        && 'uid' in object && typeof object.uid === 'number'
        && 'mid' in object && typeof object.mid === 'number'
        && 'date' in object && typeof object.date === 'string'
        && 'type' in object && typeof object.type === 'number'
        && 'content' in object && typeof object.content === 'object'
        && instanceOfMessageContentOut(object.content)
    ))
        throw new TypeError('invalid MessageDataOut');
    return true;
}
export type MessageContentIn = NormalMessageContentIn | StatusMessageContent;
// type check
export function instanceOfMessageContentIn(object: any): object is MessageContentIn {
    return (instanceOfNormalMessageContentIn(object)
        || instanceOfStatusMessageContent(object))
}
export interface NormalMessageContentIn {
    text: string,
    // all file ids attached
    files: number[]
}
// type check
export function instanceOfNormalMessageContentIn(object: any): object is NormalMessageContentIn {
    return (
        typeof object === 'object'
        && 'text' in object && typeof object.text === 'string'
        //TODO && 'files' in object
    )
}
export type MessageContentOut = NormalMessageContentOut | StatusMessageContent;
// type check
export function instanceOfMessageContentOut(object: any): object is MessageContentIn {
    return (instanceOfNormalMessageContentOut(object)
        || instanceOfStatusMessageContent(object))
}
export interface NormalMessageContentOut {
    text: string,
    files: FileDataOut[]
}
// type check
export function instanceOfNormalMessageContentOut(object: any): object is NormalMessageContentOut {
    return (
        typeof object === 'object'
        && 'text' in object && typeof object.text === 'string'
        && 'files' in object && typeof object.files === 'object' && Array.isArray(object.files)
    )
}
export interface StatusMessageContent {
    type: statusMessageTypes,
    // a array with user ids
    passiveUsers: number[]
}
// type check
export function instanceOfStatusMessageContent(object: any): object is StatusMessageContent {
    return (
        typeof object === 'object'
        && 'type' in object && typeof object.type === 'number'
        && 'passiveUsers' in object && typeof object.passiveUsers === 'object'
    )
}
export interface LoadMessages {
    chatType: string,
    chatId: number,
    // the id of the last message that has been loaded
    lastMsgId: number,
    // how many messages should be loaded?
    num: number
}
// type check
export function instanceOfLoadMessages(object: any): object is LoadMessages {
    if(!(
        typeof object === 'object'
        && 'chatType' in object && typeof object.chatType === 'string'
        && 'chatId' in object && typeof object.chatId === 'number'
        && 'lastMsgId' in object && typeof object.lastMsgId === 'number'
        && 'num' in object && typeof object.num === 'number'
    ))
        throw new TypeError('invalid LoadMessages');
    return true;
}
export interface LoadedMessages {
    status: string,
    messages: MessageDataOut[]
}
// type check
export function instanceOfLoadedMessages(object: any): object is LoadedMessages {
    if(!(
        typeof object === 'object'
        && 'status' in object && typeof object.status === 'string'
        && 'messages' in object && typeof object.messages === 'object'
        && Array.isArray(object.messages)
        && (object.messages.length > 0
            ? instanceOfMessageDataOut(object.messages[0])
            : true
        )
    ))
        throw new TypeError('invalid LoadedMessages');
    return true;
}
export interface StatusMessageDB {
    // the id of the statusMessage
    smid: number,
    // the type of the message
    type: statusMessageTypes
}
export interface NormalMessageDB {
    nmid: number,
    text: string
}
export interface MessageDB {
    mid: number,
    date: Date,
    messageType: number,
    isGroupChat: number,
    cid: number,
    uid: number
}