import {GroupChatMemberData} from "./chat";

export interface SimpleUser {
    // the username of the user
    username: string,
    // the user id of the user
    uid: number
}
// type check
export function instanceOfSimpleUser(object: any): object is GroupChatMemberData {
    if(!(
        typeof object === 'object'
        && 'uid' in object && typeof object.uid === 'number'
        && 'username' in object && typeof object.username === 'string'
    ))
        throw new TypeError('invalid SimpleUser');
    return true;
}
export interface UserExistsInfo {
    // does the user exist?
    exists: boolean,
    // the user id of the user, -1 if user does not exist
    uid: number
}