import bcrypt from 'bcrypt';

export async function login (username,password,con,chatServer){
    /*
        username should already exist
     */
    const {exists, uid} = await getUserInfo(username, con);

    if (exists) {
        /*
            is the user already online?
                if so --> login rejected
         */
        if (chatServer !== undefined && !chatServer.isUserOnline(uid)) {
            /*
                password is requested from database
             */
            const hash = await getPasswordHash(username, con);
            /*
                hash gets compared with the received password
             */
            const result = await comparePassword(password,hash);

            if (result) {
                return({
                    success: true,
                    uid: uid
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
                username: "User is already logged in!"
            });
        }
    } else {
        return({
            success: false,
            username: "Username does not exist"
        });
    }
}

export async function register (username,password,con){
    /*
        username should not exist already
     */
    const {exists,uid} = await getUserInfo(username,con);

    if(!exists){

        const hash = await hashPassword(password);
        const uid = await saveUser(username,hash,con);

        return({
            success: true,
            uid: uid
        })

    }else{
        return({
            success: false,
            username: "Username already taken"
        });
    }
}
/*
    returns two informations
        does the user exist?
        if so, the uid
 */
async function getUserInfo(username,con){

    return new Promise(function(resolve, reject){

        const query_str =
            "SELECT uid " +
            "FROM user " +
            "WHERE Username = '"+username+"';";

        con.query(query_str,function(err,result,fields){

            if (err)
                reject(err);

            if(result.length !== 0)
                resolve({
                    exists: true,
                    uid: result[0].uid
                });
            else{
                resolve({
                    exists: false
                });
            }
        });
    });
}
/*
    password gets requested from database
 */
async function getPasswordHash(username,con){

    return new Promise(function(resolve, reject) {

        const query_str =
            "SELECT password " +
            "FROM user " +
            "WHERE username = '" + username + "';";

        con.query(query_str, function (err, result, fields) {

            if(err)
                reject(err);

            const hash = result[0].password;
            resolve(hash);
        });
    });
}
/*
    new user gets saved
 */
async function saveUser(username,hash,con){

    return new Promise(function(resolve, reject) {

        const query_str =
            "INSERT " +
            "INTO user(username,password,time) " +
            "VALUES ('" + username + "','" + hash + "',CURRENT_TIMESTAMP());";

        con.query(query_str, async function (err, result, fields) {

            if(err)
                reject(err);

            const {exists,uid} = await getUserInfo(username,con);

            resolve(uid);
        });
    });
}
async function comparePassword(password,hash){

    return new Promise(function(resolve, reject) {

        bcrypt.compare(password, hash, function (err, result) {
            if(err)
                reject(err);

            resolve(result);
        });
    });
}
async function hashPassword(password){

    return new Promise(function(resolve, reject) {

        const saltRounds = 10;
        /*
                salt gets generated
             */
        bcrypt.genSalt(saltRounds, function (err, salt) {
            if(err)
                reject(err);
            /*
                hash gets generated
             */
            bcrypt.hash(password, salt, function (err, hash) {
                if(err)
                    reject(err);
                resolve(hash);
            });
        });
    });
}