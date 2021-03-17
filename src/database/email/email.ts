import {logger} from "../../util/logger";
import {pool} from "../pool";

/*
    returns if the email is already used
 */
export async function isEmailUsed(email:string):Promise<boolean> {

    return new Promise<boolean>((resolve, reject) => {

        const query_str =
            "SELECT * " +
            "FROM user " +
            "WHERE email = '" + email + "';";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,result:any) => {
            if(err)
                reject(err);
            else if(!result || result.length >= 1)
                resolve(true);
            else
                resolve(false);
        });
    });
}