import {chatServer} from "../../chatServer.js";

/*
    a specific groupChat is loaded
 */
export async function selectGroupChat(gcid){

    return new Promise(((resolve, reject) => {

        const con = chatServer.con;
        const query_str =
            "SELECT  * " +
            "FROM groupchat " +
            "WHERE gcid = " + con.escape(gcid) + ";";

        con.query(query_str,(err,result,fields) => {
            if(err)
                reject(err);
            else if(!result)
                resolve({exists: false});
            else if(result.length === 0)
                resolve({exists: false});
            else
                resolve({
                    exists: true,
                    name: result[0].name,
                    description: result[0].description,
                    public: (result[0].isPublic !== 0)
                })
        })

    }));
}