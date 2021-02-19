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
export interface RegisterData {
    // username or email address
    username: string,
    password: string
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
    return true;
}