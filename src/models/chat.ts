import {instanceOfSimpleUser, SimpleUser} from "./user";

export interface ChatInfo {
    type:string,
    id: number,
    chatName: string,
    members: SimpleUser[],
    //TODO type
    firstMessage: any,
    unreadMessages: number
}
export function instanceOfChatInfo(object: any): object is ChatInfo {
    if(!(
        typeof object === 'object'
        && 'type' in object && typeof object.type === 'string'
        && 'id' in object && typeof object.id === 'number'
        && 'chatName' in object && typeof object.chatName === 'string'
        && 'members' in object && typeof object.members === 'object'
        && Array.isArray(object.members) && object.members.length > 0
        && instanceOfSimpleUser(object.members[0])
        && 'firstMessage' in object && typeof object.firstMessage === 'object'
        && 'unreadMessages' in object && typeof object.unreadMessages === 'number'
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
        && 'ncid' in object && typeof object.ncid === 'number'
        && 'mid' in object && typeof object.mid === 'number'
    ))
        throw new TypeError('invalid NewNormalChatData');
    return true;
}
export interface GroupChatMemberData {
    // the id of the suer
    uid: number,
    // the username of the user
    username: string,
    // is the member admin?
    isAdmin: boolean
}
// type check
export function instanceOfGroupChatMemberData(object: any): object is GroupChatMemberData {
    if(!(
        typeof object === 'object'
        && 'uid' in object && typeof object.uid === 'number'
        && 'username' in object && typeof object.username === 'string'
        && 'isAdmin' in object && typeof object.isAdmin === 'boolean'
    ))
        throw new TypeError('invalid GroupChatMemberData');
    return true;
}
// the same with an id
export interface GroupChatMemberDataAll extends GroupChatMemberData{
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
        && 'name' in object && typeof object.name === 'string'
        && 'description' in object && typeof object.description === 'string'
        && 'isPublic' in object && typeof object.isPublic === 'boolean'
    ))
        throw new TypeError('invalid GroupChatData');
    return true;
}
export interface GroupChatInfo {
    // the type of the chat, either normalChat or groupChat
    type: string,
    id: number,
    chatName: string,
    description: string,
    public: boolean,
    memberSelf: {
        isAdmin: boolean
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