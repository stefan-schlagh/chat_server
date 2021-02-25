import {validateEmail} from "../util/validateEmail";

export interface LoginData {
    // username or email address
    username: string,
    password: string
}
// type check
export function instanceOfLoginData(object: any): object is LoginData {
    if(!(
        typeof object === 'object'
        && 'username' in object && typeof object.username === 'string'
        && object.username.length >= 3
        && 'password' in object && typeof object.password === 'string'
        && object.password.length >= 3
    ))
        throw new TypeError('invalid LoginData');
    return true;
}
//return interface of register
export interface RegisterReturn {
    // is the username free?
    usernameTaken: boolean,
    // is the email free?
    emailTaken: boolean,
    // the user id of the user, -1 if not success
    uid: number,
    // auth tokens, null if not success
    tokens: string
}
export interface RegisterData {
    // username or email address
    username: string,
    password: string,
    email?: string
}
// type check
export function instanceOfRegisterData(object: any): object is RegisterData {
    if(!(
        typeof object === 'object'
        && 'username' in object && typeof object.username === 'string'
        && object.username.length >= 3
        && 'password' in object && typeof object.password === 'string'
        && object.password.length >= 3
    ))
        throw new TypeError('invalid RegisterData');
    if('email' in object && !(typeof object.email === 'string' && validateEmail(object.email)))
        throw new TypeError('invalid RegisterData');
    return true;
}