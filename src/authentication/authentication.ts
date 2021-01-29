import {comparePassword,hashPassword} from "./bcryptWrappers";
import {generateToken} from "./jwt";
import {isResultEmpty, ResultEmptyError} from "../util/sqlHelpers";
import {UserExistsInfo} from "../models/user";
import {logger} from "../util/logger";

/*
    login function
    params:
        string:username --> the username of the user
        string:password --> the password of the user
        object:con --> the connection to the database, uses library mysql
    returns
        if username does not exist:
            {
                success: false,
                username: "Username does not exist"
            }
        if the password is wrong:
            {
                success: false,
                password: "Wrong password!"
            }
        if success:
            {
                success: true,
                uid: the userId of the user,
                tokens: the authorization tokens (jwt)
            }
    throws:
        see getUserInfo,getPasswordHash,comparePassword,generateToken
 */
export async function login (username:string,password:string,con:any):Promise<loginReturn>{
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
        const result = await comparePassword(password,hash);

        if (result) {

            const token = await generateToken({
                username: username,
                uid: uid
            });

            return({
                success: true,
                uid: uid,
                username: null,
                password: null,
                tokens: token
            });
        } else {
            return({
                success: false,
                uid: -1,
                username: null,
                password: "Wrong password!",
                tokens: null
            });
        }
    } else {
        return({
            success: false,
            uid: -1,
            username: "Username does not exist",
            password: null,
            tokens: null
        });
    }
}
// return interface of login
export interface loginReturn {
    success: boolean,
    // the user id of the user, -1 if not success
    uid: number,
    // username error, null if success or no error
    username: string,
    // password error, null if success or no error
    password: string,
    // auth tokens, null if not success
    tokens: string
}
/*
    a new user is registered
    params:
        string:username --> the username of the user
        string:password --> the password of the user
        object:con --> the connection to the database, uses library mysql
    returns:
        if register successfull (username does not already exist):
            {
                success: true,
                uid: the userId of the new user,
                tokens: the authorization tokens (jwt)
            }
        else:
            {
                success: false,
                username: "Username already taken"
            }
    throws:
        see getUserInfo,hashPassword,saveUser,generateToken
 */
export async function register (username:string,password:string,con:any):Promise<registerReturn>{
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
            success: true,
            uid: uid,
            username: null,
            tokens: token
        })

    }else{
        return({
            success: false,
            uid: -1,
            username: 'Username already taken',
            tokens: null
        });
    }
}
//return interface of register
export interface registerReturn {
    success: boolean,
    // the user id of the user, -1 if not success
    uid: number,
    // username error, null if success or no error
    username: string,
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
            "WHERE Username = " + con.escape(username) + ";";
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