import crypto from "crypto";
/*
    000004efbghjgkjkaghfkjhagkhf
    4 Bytes  uid
    rest  hash
 */
export function extractParts(code){
    let hexUid = code.substring(0,8);
    let hash = code.substring(8,code.length);
    let uid = parseInt(hexUid,16);

    return({
        uid: uid,
        hash: hash
    });
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
export async function generateCode(){
    await new Promise((resolve, reject) => {
        crypto.randomBytes(48, function(err, buffer) {
            if(err)
                reject(err)
            resolve(buffer.toString('hex'));
        });
    })
}
export function generatePWResetCode(){

}
export function generateVerificationCode(){

}
function savecodeInDB(){

}

