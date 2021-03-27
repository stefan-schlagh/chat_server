import {instanceOfSimpleUser, SimpleUser} from "./user";
import {instanceOfMessageDataOut, MessageDataOut, NewestMessage} from "./message";

export interface ChatData {
    type:string,
    id: number,
    chatName: string,
    members: SimpleUser[]
}
export function instanceOfChatData(object: any): object is ChatData {
    return (
        typeof object === 'object'
        && object !== null
        && 'type' in object && typeof object.type === 'string'
        && 'id' in object && typeof object.id === 'number'
        && 'chatName' in object && typeof object.chatName === 'string'
        && 'members' in object && typeof object.members === 'object'
        && Array.isArray(object.members) && object.members.length > 0
        && instanceOfSimpleUser(object.members[0])
    )
}
export interface ChatInfo extends ChatData {
    /*
        if normalChat:
            blockedBySelf: did the requesting user block the other user?
            blockedByOther: did the other user block the requesting user?
     */
    blockedBySelf?: boolean,
    blockedByOther?: boolean,
    // if groupChat: is the user still member?
    isStillMember?: boolean,
    firstMessage: NewestMessage,
    unreadMessages: number
}
export function instanceOfChatInfo(object: any): object is ChatInfo {
    if(!(
        typeof object === 'object'
        && object !== null
        && 'firstMessage' in object && typeof object.firstMessage === 'object'
        && 'unreadMessages' in object && typeof object.unreadMessages === 'number'
        && instanceOfChatData(object)
    ))
        throw new TypeError('invalid ChatInfo');
    return true;
}
export interface NewNormalChatData {
    // the id of the chat
    ncid: number,
    // the id of the first message
    mid: number
}
export function instanceOfNewNormalChatData(object: any): object is NewNormalChatData {
    if(!(
        typeof object === 'object'
        && object !== null
        && 'ncid' in object && typeof object.ncid === 'number'
        && 'mid' in object && typeof object.mid === 'number'
    ))
        throw new TypeError('invalid NewNormalChatData');
    return true;
}
export interface GroupChatMemberData extends SimpleUser {
    // is the member admin?
    isAdmin: boolean
}
// type check
export function instanceOfGroupChatMemberData(object: any): object is GroupChatMemberData {
    if(!(
        typeof object === 'object'
        && object !== null
        && 'isAdmin' in object && typeof object.isAdmin === 'boolean'
        && instanceOfSimpleUser(object)
    ))
        throw new TypeError('invalid GroupChatMemberData');
    return true;
}
// the same with an id
export interface GroupChatMemberDataAll extends GroupChatMemberData {
    // the id of the GroupChatMember
    gcmid: number
}
export interface GroupChatData {
    // the name of the groupChat
    name: string,
    // the description of the groupChat
    description: string,
    // is the chat public?
    isPublic: boolean
}
// type check
export function instanceOfGroupChatData(object: any): object is GroupChatData {
    if(!(
        typeof object === 'object'
        && object !== null
        && 'name' in object && typeof object.name === 'string'
        && 'description' in object && typeof object.description === 'string'
        && 'isPublic' in object && typeof object.isPublic === 'boolean'
    ))
        throw new TypeError('invalid GroupChatData');
    return true;
}
export interface GroupChatDataOut extends GroupChatData {
    // the id of the chat
    id: number
}
export function instanceOfGroupChatDataOut(object: any): object is GroupChatDataOut {
    if(!(
        typeof object === 'object'
        && object !== null
        && 'id' in object && typeof object.id === 'number'
        && instanceOfGroupChatData(object)
    ))
        throw new TypeError('invalid GroupChatDataOut');
    return true;
}
export interface GroupChatInfoWithoutMembers {
    id: number,
    chatName: string,
    description: string,
    public: boolean
}
export interface GroupChatInfo extends GroupChatInfoWithoutMembers {
    // the type of the chat, either normalChat or groupChat
    type: string,
    // memberSelf and members are optional
    memberSelf: {
        isAdmin: boolean,
        isStillMember: boolean
    },
    members: GroupChatMemberDataAll[]
}
export interface ChangeChatData {
    type: string,
    id: number
}
// type check
export function instanceOfChangeChatData(object: any): object is ChangeChatData {
    return (
        object !== null
        && typeof object === 'object'
        && 'type' in object && typeof object.type === 'string'
        && 'id' in object && typeof object.id === 'number'
    )
}
export interface NewChatData extends ChatData {
    firstMessage: MessageDataOut
}
// type check
export function instanceOfNewChatData(object: any): object is NewChatData {
    if(!(
        typeof object === 'object'
        && object !== null
        && 'firstMessage' in object && typeof object.firstMessage === 'object'
        && instanceOfMessageDataOut(object.firstMessage)
        && instanceOfChatData(object)
    ))
        throw new TypeError('invalid NewChatData');
    return true;
}
export enum groupChatMemberChangeTypes {
    joined = 0,
    left = 1
}
export interface GroupChatMemberChange {
    date: Date,
    type: groupChatMemberChangeTypes
}
export interface GroupChatDataOfUser {
    gcid: number,
    gcmid: number,
    name: string,
    description: string,
    isPublic: number,
    isStillMember: number
}