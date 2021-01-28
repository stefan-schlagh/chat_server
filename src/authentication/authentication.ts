import {comparePassword,hashPassword} from "./bcryptWrappers";
import {generateToken} from "./jwt";
import {isResultEmpty, ResultEmptyError} from "../util/sqlHelpers";
import {exists} from "fs";

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
export async function login (username:any,password:any,con:any){
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
                tokens: token
            });
        } else {
            return({
                success: false,
                password: "Wrong password!"
            });
        }
    } else {
        return({
            success: false,
            username: "Username does not exist"
        });
    }
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
export async function register (username:any,password:any,con:any){
    /*
        username should not exist already
     */
    const res:any = await getUserInfo(username,con);
    const exists = res.exists;

    if(!exists){

        const hash = await hashPassword(password);
        const uid = await saveUser(username,hash,con);

        const token = await generateToken({
            username: username,
            uid: uid
        });

        return({
            success: true,
            uid: uid,
            tokens: token
        })

    }else{
        return({
            success: false,
            username: 'Username already taken'
        });
    }
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
export async function getUserInfo(username:any,con:any){

    if(typeof username !== "string")
        throw new Error('username should have the type string!')

    return await new Promise(function(resolve, reject){

        const query_str =
            "SELECT uid " +
            "FROM user " +
            "WHERE Username = " + con.escape(username) + ";";

        con.query(query_str,function(err:any,result:any){

            if (err)
                reject(err);
            else if(isResultEmpty(result))
                resolve({
                    exists: false
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
export async function getPasswordHash(uid:any,con:any){

    if(typeof uid !== "number")
        throw new Error('uid should have the type number!')

    return await new Promise(function(resolve, reject) {

        const query_str =
            "SELECT password " +
            "FROM user " +
            "WHERE uid = " + uid + ";";

        con.query(query_str, function (err:any, result:any) {

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
export async function saveUser(username:any,hash:any,con:any){

    if(typeof username !== "string")
        throw new Error('username should have the type string!')
    if(typeof hash !== "string")
        throw new Error('hash should have the type string!')

    return await new Promise(function(resolve, reject) {

        const query_str =
            "INSERT " +
            "INTO user(username,password,time,email,isVerified) " +
            "VALUES (" + con.escape(username) + ",'" + hash + "',CURRENT_TIMESTAMP(),'',0);";

        con.query(query_str, async function (err:any) {

            if(err)
                reject(err);
            try {
                //TODO type
                const res:any =  await getUserInfo(username, con);
                resolve(res.uid);
            }catch (err) {
                reject(err);
            }
        });
    });
}