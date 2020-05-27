import chatData from './chatData/chatData.js';

export function setUser(req,res,next){
    /*
        is the session already set?
     */
    if(req.session) {
        /*
            uid and username are extracted from session
         */
        const {uid,username} = req.session;

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
        }
    }
    next();
}

export function reqAuth(req,res,next){

    if(!req.user) {
        res.status(403);
        res.send();
    }else{
        next();
    }
}