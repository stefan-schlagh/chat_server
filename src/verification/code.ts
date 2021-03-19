import crypto from "crypto";
import {comparePassword, hashPassword} from "../authentication/bcryptWrappers";
import {deleteOldCodes, getCodes, saveCodeInDB} from "../database/verification/verificationcode";
import {VerificationCodeDB} from "../models/code";

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
    a newly generated verificationCode
 */
export interface VerificationCode {
    // the verificationCode
    sCode: string,
    // the id of the code
    vcid: number
}
/*
    000004efbghjgkjkaghfkjhagkhf
    4 Bytes  uid (000004ef  1263)
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
export async function verifyCode(parts:Parts,type:verificationCodeTypes):Promise<number> {
    //codes older than 2 days are deleted
    await deleteOldCodes(parts.uid);

    const codes:VerificationCodeDB[] = await getCodes(parts.uid,type);

    for(let i = 0;i < codes.length;i ++){
        if(type.valueOf() === codes[i].type)
            if(await comparePassword(parts.code,codes[i].hash)){
                return codes[i].vcid;
            }
    }
    return -1;
}
export function toHex(num:number,len:number):string{
    let sNum = num.toString(16);
    if(sNum.length > len)
        throw new Error("number to  long!");
    return getCharString(len - sNum.length,"0") + sNum;
}
export function getCharString(len:number,char:string):string{
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
export async function generateVerificationCode(type:verificationCodeTypes,uid:number):Promise<VerificationCode>{

    const code:string = await generateCode();

    const vcid:number = await saveCodeInDB(type,uid,await hashPassword(code))
    //sCode and verificationCodeID is returned
    return {
        sCode: toHex(uid, 8) + code,
        vcid: vcid
    }

}
export async function generateCode():Promise<string>{
    return await new Promise((resolve, reject) => {
        crypto.randomBytes(32, function(err, buffer) {
            if(err)
                reject(err)
            resolve(buffer.toString('hex'));
        });
    })
}