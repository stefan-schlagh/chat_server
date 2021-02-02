import bcrypt from "bcrypt";

export async function comparePassword(password:string,hash:string):Promise<boolean>{

    return new Promise(function(resolve, reject) {

        bcrypt.compare(password, hash, function (err:Error, result:boolean) {
            if(err)
                reject(err);

            resolve(result);
        });
    });
}
export async function hashPassword(password:string):Promise<string>{

    return new Promise(function(resolve, reject) {

        const saltRounds = 10;
        /*
                salt gets generated
             */
        bcrypt.genSalt(saltRounds, function (err:Error, salt:string) {
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