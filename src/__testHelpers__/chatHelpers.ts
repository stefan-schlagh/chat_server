import {UserInfo} from "../models/user";
import {ChatInfo, GroupChatDataOut, GroupChatInfoWithoutMembers} from "../models/chat";

export function findChatChatName(data:ChatInfo[],chatName:string):ChatInfo {
    for(let i = 0;i < data.length;i++){
        if(data[i].chatName === chatName)
            return data[i];
    }
    return null;
}
export function findGroupChatInUserInfo (data:UserInfo,id:number):GroupChatInfoWithoutMembers {
    for(let i = 0;i < data.groups.length;i++){
        if(data.groups[i].id === id)
            return data.groups[i];
    }
    return null;
}
export function findPublicGroupChat (data:GroupChatDataOut[],id:number):GroupChatDataOut {
    for(let i = 0;i < data.length;i++){
        if(data[i].id === id)
            return data[i];
    }
    return null;
}