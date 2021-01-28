import crypto from "crypto";
import {con} from "../app";
import {comparePassword,hashPassword} from "../authentication/bcryptWrappers";
import {isResultEmpty, ResultEmptyError} from "../util/sqlHelpers";

/*
    the types the verificationCode can be
 */
export enum verificationCodeTypes {
    emailVerification = 0,
    pwReset = 1
}
/*
    the parts of the verificationCode
        uid: the id of the user
        code: the hashed verificationCode
 */
export interface Parts{
    uid: number,
    code: string
}
/*
    000004efbghjgkjkaghfkjhagkhf
    4 Bytes  uid
    rest  hash
 */
export function extractParts(sCode:string):Parts{
    let hexUid = sCode.substring(0,8);
    let code = sCode.substring(8,sCode.length);
    let uid = parseInt(hexUid,16);

    if(isNaN(uid))
        throw new Error('uid is nan!');

    return({
        uid: uid,
        code: code
    });
}
/*
    verify a code
    arguments
        parts: the parts of the code
        type: the type of the code
    returns the id of the verificationCode, if valid
        else, -1
 */
export async function verifyCode(parts:Parts,type:verificationCodeTypes):Promise<number>{
    //codes older than 2 days are deleted
    await new Promise((resolve, reject) => {
        const query_str =
            "DELETE " +
            "FROM verificationcode " +
            "WHERE uid = " + parts.uid + " AND DATEDIFF(CURRENT_TIMESTAMP(),date) > 2;";
        con.query(query_str,(err:Error,result:any) => {
            if(err)
                reject(err);
            resolve(result);
        });
    });

    const res:any = await new Promise((resolve, reject) => {
        const query_str =
            "SELECT vcid,type,hash " +
            "FROM verificationcode " +
            "WHERE uid = " + parts.uid + " " +
            "AND type = " + type.valueOf() + ";";
        con.query(query_str,(err:Error,result:any) => {
            if(err)
                reject(err);
            resolve(result);
        });
    });

    for(let i=0;i<res.length;i++){
        if(type === res[i].type)
            if(await comparePassword(parts.code,res[i].hash)){
                const vc = res[i];
                return vc.vcid;
            }
    }
    return -1;
}
export function toHex(num:number,len:number){
    let sNum = num.toString(16);
    if(sNum.length > len)
        throw new Error("number to  long!");
    return getCharString(len - sNum.length,"0") + sNum;
}
export function getCharString(len:number,char:string){
    let str = "";
    for(let i=0;i<len;i++) {
        str += char;
    }
    return str;
}
/*
    code is generated and hash is saved into DB
        returns: sCode: uid(4Byte) + code
 */
export async function generateVerificationCode(type:verificationCodeTypes,uid:number){

    const code = await generateCode();

    const vcid = await saveCodeInDB(type,uid,await hashPassword(code))
    //sCode and verificationCodeID is returned
    return {
        sCode: toHex(uid, 8) + code,
        vcid: vcid
    }

}
export async function generateCode(){
    return await new Promise((resolve, reject) => {
        crypto.randomBytes(32, function(err, buffer) {
            if(err)
                reject(err)
            resolve(buffer.toString('hex'));
        });
    })
}
async function saveCodeInDB(type:verificationCodeTypes,uid:number,hash:string){

    const query_str =
        "INSERT " +
        "INTO verificationcode(type,uid,hash,date) " +
        "VALUES(" + type.valueOf() + "," + uid + "," + con.escape(hash) + ",CURRENT_TIMESTAMP());";

    await new Promise((resolve, reject) => {
        con.query(query_str,async (err:Error,result:any) => {
           if(err)
               reject(err);
           resolve();
        });
    });
    return await new Promise((resolve, reject) => {
        const query_str1 =
            "SELECT max(vcid) " +
            "AS 'vcid' " +
            "FROM verificationcode " +
            "WHERE uid = " + uid + ";";
        con.query(query_str1,(err:Error,result:any) => {
            if(err)
                reject(err);
            else if(isResultEmpty(result))
                reject(new ResultEmptyError());
            else
                resolve(result[0].vcid);
        });
    });
}