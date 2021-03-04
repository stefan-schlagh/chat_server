import {UserInfo} from "../models/user";
import {GroupChatInfoWithoutMembers} from "../models/chat";

export function findGroupChatInUserInfo (data:UserInfo,id:number):GroupChatInfoWithoutMembers {
    for(let i = 0;i < data.groups.length;i++){
        if(data.groups[i].id === id)
            return data.groups[i];
    }
    return null;
}