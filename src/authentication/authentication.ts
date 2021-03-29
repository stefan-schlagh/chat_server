import {comparePassword, hashPassword} from "./bcryptWrappers";
import {generateToken} from "./jwt";
import {AuthError, errorTypes} from "./authError";
import {RegisterReturn} from "../models/auth";
import {getUserExistsInfo} from "../database/user/user";
import {getPasswordHash, saveUser} from "../database/authentication/authentication";

/*
    login function
    params:
        string:username --> the username of the user
        string:password --> the password of the user
        object:con --> the connection to the database, uses library mysql
 */
export async function login (username:string,password:string):Promise<LoginReturn> {
    /*
        username should already exist
     */
    const res:any = await getUserExistsInfo(username);
    const {exists, uid} = res;

    if (exists) {
        /*
            password is requested from database
         */
        const hash = await getPasswordHash(uid);
        /*
            hash gets compared with the received password
         */
        if (await comparePassword(password,hash)) {

            const token = await generateToken({
                username: username,
                uid: uid
            });

            return({
                uid: uid,
                tokens: token
            });
        } else
            throw new AuthError('wrong password!',errorTypes.wrongPassword)
    } else
        throw new AuthError('username does not exist!',errorTypes.userNotExisting)
}
// return interface of login
export interface LoginReturn {
    // the user id of the user, -1 if not success
    uid: number,
    tokens: string
}
/*
    a new user is registered
    params:
        string:username --> the username of the user
        string:password --> the password of the user
        object:con --> the connection to the database, uses library mysql
    throws:
        see getUserInfo,hashPassword,saveUser,generateToken
 */
export async function register (username:string,password:string):Promise<RegisterReturn> {
    /*
        username should not exist already
     */
    const res:any = await getUserExistsInfo(username);
    const exists = res.exists;

    if(!exists){

        const hash = await hashPassword(password);
        const uid:number = await saveUser(username,hash);

        const token = await generateToken({
            username: username,
            uid: uid
        });

        return({
            usernameTaken: false,
            emailTaken: false,
            uid: uid,
            tokens: token
        })

    }else{
        return({
            usernameTaken: true,
            emailTaken: false,
            uid: -1,
            tokens: null
        });
    }
}