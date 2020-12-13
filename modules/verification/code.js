import crypto from "crypto";
import {con} from "../app.js";
import {comparePassword,hashPassword} from "../authentication/bcryptWrappers.js";
import {isResultEmpty, ResultEmptyError} from "../util/sqlHelpers.js";

export const verificationCodeTypes = {
    emailVerification: 0,
    pwReset: 1
}
/*
    000004efbghjgkjkaghfkjhagkhf
    4 Bytes  uid
    rest  hash
 */
export function extractParts(sCode){
    let hexUid = sCode.substring(0,8);
    let code = sCode.substring(8,sCode.length);
    let uid = parseInt(hexUid,16);

    return({
        uid: uid,
        code: code
    });
}
export async function verifyCode(parts,type,returnBoolean = true){
    //codes older than 2 days are deleted
    await new Promise((resolve, reject) => {
        const query_str =
            "DELETE " +
            "FROM verificationcode " +
            "WHERE uid = " + parts.uid + " AND DATEDIFF(CURRENT_TIMESTAMP(),date) > 2;";
        con.query(query_str,(err,result) => {
            if(err)
                reject(err);
            resolve(result);
        });
    });

    const res = await new Promise((resolve, reject) => {
        const query_str =
            "SELECT vcid,type,hash " +
            "FROM verificationcode " +
            "WHERE uid = " + parts.uid + " " +
            "AND type = " + type + ";";
        con.query(query_str,(err,result) => {
            if(err)
                reject(err);
            resolve(result);
        });
    });

    for(let i=0;i<res.length;i++){
        if(type === res[i].type)
            if(await comparePassword(parts.code,res[i].hash)){
                if(returnBoolean)
                    return true;
                else{
                    const vc = res[i];
                    return {
                        vcid: vc.vcid
                    }
                }
            }
    }
    if(returnBoolean)
        return false;
    else
        return  null;
}
export function toHex(num,len){
    let sNum = num.toString(16);
    if(sNum.length > len)
        throw new Error("number to  long!");
    return getCharString(len - sNum.length,"0") + sNum;
}
export function getCharString(len,char){
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
export async function generateVerificationCode(type,uid){

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
async function saveCodeInDB(type,uid,hash){

    const query_str =
        "INSERT " +
        "INTO verificationcode(type,uid,hash,date) " +
        "VALUES(" + type + "," + uid + "," + con.escape(hash) + ",CURRENT_TIMESTAMP());";

    await new Promise((resolve, reject) => {
        con.query(query_str,async (err,result) => {
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
        con.query(query_str1,(err,result) => {
            if(err)
                reject(err);
            else if(isResultEmpty(result))
                reject(new ResultEmptyError());
            else
                resolve(result[0].vcid);
        });
    });
}