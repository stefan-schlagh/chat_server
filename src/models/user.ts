export interface SimpleUser {
    // the username of the user
    username: string,
    // the user id of the user
    uid: number
}
export interface UserExistsInfo {
    // does the user exist?
    exists: boolean,
    // the user id of the user, -1 if user does not exist
    uid: number
}