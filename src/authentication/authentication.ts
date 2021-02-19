import {comparePassword, hashPassword} from "./bcryptWrappers";
import {generateToken} from "./jwt";
import {isResultEmpty, ResultEmptyError} from "../util/sqlHelpers";
import {UserExistsInfo} from "../models/user";
import {logger} from "../util/logger";
import {AuthError, errorTypes} from "./authError";

/*
    login function
    params:
        string:username --> the username of the user
        string:password --> the password of the user
        object:con --> the connection to the database, uses library mysql
 */
export async function login (username:string,password:string,con:any):Promise<LoginReturn> {
    /*
        username should already exist
     */
    const res:any = await getUserInfo(username, con);
    const {exists, uid} = res;

    if (exists) {
        /*
            password is requested from database
         */
        const hash = await getPasswordHash(uid, con);
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
export async function register (username:string,password:string,con:any):Promise<RegisterReturn> {
    /*
        username should not exist already
     */
    const res:any = await getUserInfo(username,con);
    const exists = res.exists;

    if(!exists){

        const hash = await hashPassword(password);
        const uid:number = await saveUser(username,hash,con);

        const token = await generateToken({
            username: username,
            uid: uid
        });

        return({
            usernameTaken: false,
            uid: uid,
            tokens: token
        })

    }else{
        return({
            usernameTaken: true,
            uid: -1,
            tokens: null
        });
    }
}
//return interface of register
export interface RegisterReturn {
    // is the username free?
    usernameTaken: boolean,
    // the user id of the user, -1 if not success
    uid: number,
    // auth tokens, null if not success
    tokens: string
}
/*
    checks if the user exists in the database
    params:
        string:username --> the username of the user
        object:con --> the connection to the database, uses library mysql
    returns
        {
            boolean:exists: does the requested user exist?,
            number:uid: the user id of the user
        }
    throws
        error if the query fails
        if there is more than one entry with the username
 */
export async function getUserInfo(username:string,con:any):Promise<UserExistsInfo>{

    return await new Promise(function(resolve, reject){

        const query_str =
            "SELECT uid " +
            "FROM user " +
            "WHERE " +
                "username = " + con.escape(username) + " " +
                "OR email = " + con.escape(username) + ";";
        logger.verbose('SQL: %s',query_str);

        con.query(query_str,function(err:any,result:any){

            if (err)
                reject(err);
            else if(isResultEmpty(result))
                resolve({
                    exists: false,
                    uid: -1
                });
            else if(result.length > 1)
                reject(new Error('There are two entries in the database with username: ' + username))
            else
                resolve({
                    exists: true,
                    uid: result[0].uid
                });
        });
    });
}
/*
    the password of the user is requested from the database
    params:
        number:uid --> the userId of the user
        object:con --> the connection to the database, uses library mysql
    returns:
        string:hash --> the hashed password
    throws
        error if the query fails
        if result is empty
 */
export async function getPasswordHash(uid:number,con:any):Promise<string>{

    if(typeof uid !== "number")
        throw new Error('uid should have the type number!')

    return await new Promise(function(resolve, reject) {

        const query_str =
            "SELECT password " +
            "FROM user " +
            "WHERE uid = " + uid + ";";
        logger.verbose('SQL: %s',query_str);

        con.query(query_str, function (err:Error, result:any) {

            if(err)
                reject(err);
            else if(isResultEmpty(result))
                reject(new ResultEmptyError());
            else {
                const hash = result[0].password;
                resolve(hash);
            }
        });
    });
}
/*
    a new user gets saved
    params:
        string:username --> the username of the new user
        string:hash --> the hashed password of the new user
        object:con --> the connection to the database, uses library mysql
 */
export async function saveUser(username:string,hash:string,con:any):Promise<number>{

    return await new Promise(function(resolve, reject) {

        const query_str =
            "INSERT " +
            "INTO user(username,password,time,email,isVerified) " +
            "VALUES (" + con.escape(username) + ",'" + hash + "',CURRENT_TIMESTAMP(),'',0);";
        logger.verbose('SQL: %s',query_str);

        con.query(query_str, async function (err:any) {

            if(err)
                reject(err);
            try {
                const res:UserExistsInfo =  await getUserInfo(username, con);
                resolve(res.uid);
            }catch (err) {
                reject(err);
            }
        });
    });
}