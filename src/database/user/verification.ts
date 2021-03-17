import {logger} from "../../util/logger";
import {Parts, verificationCodeTypes, verifyCode} from "../../verification/code";
import {isResultEmpty, ResultEmptyError} from "../../util/sqlHelpers";
import {pool} from "../pool";

/*
    returns if the email of the user is verified
        uid: the id of the user
 */
export async function isVerified(uid:number):Promise<boolean> {
    const result:any = await new Promise((resolve, reject) => {
        const query_str =
            "SELECT isVerified " +
            "FROM user " +
            "WHERE uid = " + uid + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,result:any) => {
            if(err)
                reject(err);
            resolve(result);
        });
    });
    return result[0].isVerified === 1;
}
/*
    all current verificationCodes of the user are deleted
        uid: the id of the user
 */
export async function deleteVerificationCodes(uid:number):Promise<void> {
    await new Promise((resolve, reject) => {
        const query_str =
            "DELETE " +
            "FROM verificationcode " +
            "WHERE uid = " + uid + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error) => {
            if(err)
                reject(err);
            resolve();
        });
    });
}
/*
    gets called when the email should be verified with a verificationCode
        uid: the id of the user
        parts: the verificationCode
 */
export async function verifyEmail(uid:number,parts:Parts):Promise<boolean> {
    //verifyCode
    const vcid:number = await verifyCode(parts,verificationCodeTypes.emailVerification);
    if(vcid !== -1){
        //email change is selected from DB
        const result:any = await new Promise((resolve, reject) => {
            const query_str =
                "SELECT * " +
                "FROM emailchange " +
                "WHERE vcid = " + vcid + ";";
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str,(err:Error,result:any) => {
                if(err)
                    reject(err);
                else if(isResultEmpty(result))
                    reject(new ResultEmptyError());
                else
                    resolve(result[0]);
            });
        });
        //emailChange is set to verified
        await new Promise((resolve, reject) => {
            const query_str =
                "UPDATE emailchange " +
                "SET isVerified = 1 " +
                "WHERE vcid = " + vcid + ";";
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str,(err:Error) => {
                if(err)
                    reject(err);
                resolve();
            });
        });
        //new email is written to user
        await new Promise((resolve, reject) => {
            const query_str =
                "UPDATE user " +
                "SET email = " + pool.escape(result.newEmail) + ",isVerified = 1 " +
                "WHERE uid = " + uid + ";";
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str,(err:Error) => {
                if(err)
                    reject(err);
                resolve();
            });
        });
        return true;
    }else{
        return false;
    }
}