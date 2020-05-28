import {isUserPartOfGroup, selectGroupChat, selectUsers} from "../database/loadChats.js";

/*
    the info of the requested groupChat is returned
 */
export async function getGroupChatInfo(uidReq,gcid){

    const group = await selectGroupChat(gcid);
    /*
        does the group exist?
     */
    if(group.exists){
        /*
            is the user part of the chat or is the chat public
                -> users are loaded
         */
        if(group.public || await isUserPartOfGroup(uidReq,gcid)){

            group.users = await selectUsers(gcid);
        }
    }
    return group;
}