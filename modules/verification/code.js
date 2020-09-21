import crypto from "crypto";
import {con} from "../app.js";
import {comparePassword,hashPassword} from "../authentication/bcryptWrappers.js";

export const verificationCodeTypes = {
    verification: 0,
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
export async function verifyCode(parts,type){
    /*
        TODO: delete old codes
     */

    const query_str =
        "SELECT type,hash " +
        "FROM verificationCode " +
        "WHERE uid = " + parts.uid + ";";

    const res = await new Promise((resolve, reject) => {
        con.query(query_str,(err,result) => {
            if(err)
                reject(err);
            resolve(result);
        })
    });

    for(let i=0;i<res.length;i++){
        if(type === res.type)
            if(await comparePassword(parts.code,res.hash))
                return true;
    }
    return false;
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

    await saveCodeInDB(type,uid,await hashPassword(code))

    return {
        sCode: toHex(uid,8) + code
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
        "INTO verificationCode(type,uid,hash) " +
        "VALUES(" + type + "," + uid + "," + con.escape(hash) + ");";

    await new Promise((resolve, reject) => {
        con.query(query_str,(err,result) => {
           if(err)
               reject(err);
           resolve(result);
        });
    })
}