import {Chat, chatTypes} from "../chat/chat";
import User from "../user";
import {MessageDataOut, messageTypes} from "../../models/message";
import GroupChatMember from "../chat/groupChatMember";
import {GroupChat} from "../chat/groupChat";

export default abstract class Message{

    private _mid:number;
    private _messageType:messageTypes;
    private _chat:Chat;
    private _author:User;
    private _date:Date;

    protected constructor(
        chat:Chat,
        author:User,
        messageType:messageTypes,
        mid:number = -1
    ) {

        this.messageType = messageType;
        this.chat = chat;
        this.date = new Date(Date.now());
        this.author = author;
        this.mid = mid;
    }
    // an object containing this message is returned
    abstract getMessageObject():MessageDataOut;
    //data is type of MessageContent
    abstract async initNewMessage(data:any):Promise<void>;
    /*
        can the message be shown
            current members can see all messages
            if groupChatMember not in chat anymore --> not
     */
    async authenticateMessage(user:User):Promise<boolean> {
        // is chat a groupChat
        if(this.chat.type === chatTypes.groupChat) {
            // get the member
            const member: GroupChatMember = (this.chat as GroupChat).getMember(user.uid);
            if(member.isStillMember)
                return true;
            else
            // was the member in the chat at the time of the message?
                return await member.wasInChat(this.date);
        } else
            return true;
    }

    get mid(): number {
        return this._mid;
    }

    set mid(value: number) {
        this._mid = value;
    }

    get messageType(): messageTypes {
        return this._messageType;
    }

    set messageType(value: messageTypes) {
        this._messageType = value;
    }

    get chat(): Chat {
        return this._chat;
    }

    set chat(value: Chat) {
        this._chat = value;
    }

    get author(): User {
        return this._author;
    }

    set author(value: User) {
        this._author = value;
    }

    get date(): Date {
        return this._date;
    }

    set date(value: Date) {
        this._date = value;
    }
}
