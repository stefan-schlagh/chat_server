export interface SimpleUser {
    // the username of the user
    username: string,
    // the user id of the user
    uid: number
}
// type check
export function instanceOfSimpleUser(object: any): object is SimpleUser {
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
export interface UserInfo {
    uidSelf: number,
    username: string,
    blocked: boolean,
    userExists: boolean
}
// type check
export function instanceOfUserInfo(object: any): object is UserInfo {
    if(!(
        typeof object === 'object'
        && 'uidSelf' in object && typeof object.uidSelf === 'number'
        && 'username' in object && typeof object.username === 'string'
        && 'blocked' in object && typeof object.blocked === 'boolean'
        && 'userExists' in object && typeof object.userExists === 'boolean'
    ))
        throw new TypeError('invalid UserInfo');
    return true;
}
export interface UserInfoSelf extends SimpleUser{
    email: string,
    emailVerified: boolean,
    accountCreationTime: string,
}
// type check
export function instanceOfUserInfoSelf(object: any): object is UserInfoSelf {
    if(!(
        typeof object === 'object'
        && 'email' in object && typeof object.email === 'string'
        && 'emailVerified' in object && typeof object.emailVerified === 'boolean'
        && 'accountCreationTime' in object && typeof object.accountCreationTime === 'string'
        && instanceOfSimpleUser(object)
    ))
        throw new TypeError('invalid UserInfoSelf');
    return true;
}