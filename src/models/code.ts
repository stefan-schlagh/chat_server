import {verificationCodeTypes} from "../verification/code";

export interface SetPassword {
    code: string,
    password: string
}
// type check
export function instanceOfSetPassword(object: any): object is SetPassword {
    if(!(
        typeof object === 'object'
        && 'code' in object && typeof object.code === 'string'
        && 'password' in object && typeof object.password === 'string'
    ))
        throw new TypeError('invalid SetPassword');
    return true;
}
export interface UsernameEmail {
    username: string,
    email: string
}
// type check
export function instanceOfUsernameEmail(object: any): object is UsernameEmail {
    if(!(
        typeof object === 'object'
        && 'username' in object && typeof object.username === 'string'
        && 'email' in object && typeof object.email === 'string'
    ))
        throw new TypeError('invalid UsernameEmail');
    return true;
}
export interface VerificationCodeDB {
    vcid:number,
    type:number,
    hash:string
}