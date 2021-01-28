import bcrypt from "bcrypt";

//TODO type
export async function comparePassword(password:any,hash:any):Promise<any>{

    return new Promise(function(resolve, reject) {

        bcrypt.compare(password, hash, function (err, result) {
            if(err)
                reject(err);

            resolve(result);
        });
    });
}
export async function hashPassword(password:any):Promise<string>{

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