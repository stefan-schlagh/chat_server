import chatData from "./chatData";

export function setUser(req:any,res:any,next:any){
    /*
        uid and username are extracted from data
     */
    const {uid,username} = req.data;

    if(!isNaN(uid)){
        /*
            does the user exist?
                otherwise it will be created
         */
        const user = chatData.user.get(uid);
        if(user)
            req.user = user;
        else
            /*
                user is created
             */
            req.user = chatData.addNewUser(uid,username);
    }else{
        res.status(400);
        res.send();
    }
    next();
}