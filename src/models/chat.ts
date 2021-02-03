export interface NewNormalChatData {
    // the id of the chat
    ncid: number,
    // the id of the first message
    mid: number
}
export interface GroupChatMemberData {
    // the id of the suer
    uid: number,
    // the username of the user
    username: string,
    // is the member admin?
    isAdmin: boolean
}
// the same with an id
export interface GroupChatMemberDataAll extends GroupChatMemberData{
    // the id of the GroupChatMember
    gcmid: number
}
export interface GroupChatData {
    // the name of the groupChat
    name: string,
    // the description of the groupChat
    description: string,
    // is the chat public?
    isPublic: boolean
}
export interface RemoveMemberReturn {
    mid: number
}
export interface GroupChatInfo {
    type: string,
    id: number,
    chatName: string,
    description: string,
    public: boolean,
    memberSelf: {
        isAdmin: boolean
    },
    members: GroupChatMemberDataAll[]
}