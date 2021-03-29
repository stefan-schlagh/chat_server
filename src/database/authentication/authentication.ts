import {logger} from "../../util/logger";
import {isResultEmpty, ResultEmptyError} from "../../util/sqlHelpers";
import {UserExistsInfo} from "../../models/user";
import {getUserExistsInfo} from "../user/user";
import {pool} from "../pool";

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
export async function getPasswordHash(uid: number): Promise<string> {

    if (typeof uid !== "number")
        throw new Error('uid should have the type number!')

    return await new Promise(function (resolve, reject) {

        const query_str =
            "SELECT password " +
            "FROM user " +
            "WHERE uid = " + uid + ";";
        logger.verbose('SQL: %s', query_str);

        pool.query(query_str, function (err: Error, rows: any) {

            if (err)
                reject(err);
            else if (isResultEmpty(rows))
                reject(new ResultEmptyError());
            else {
                const hash = rows[0].password;
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
export async function saveUser(username: string, hash: string): Promise<number> {

    return await new Promise(function (resolve, reject) {

        const query_str =
            "INSERT " +
            "INTO user(username,password,time,email,isVerified) " +
            "VALUES (" + pool.escape(username) + ",'" + hash + "',CURRENT_TIMESTAMP(),'',0);";
        logger.verbose('SQL: %s', query_str);

        pool.query(query_str, async function (err:Error) {

            if (err)
                reject(err);
            try {
                const res: UserExistsInfo = await getUserExistsInfo(username);
                resolve(res.uid);
            } catch (err) {
                reject(err);
            }
        });
    });
}