import {Chat} from "./chat";

export default class ChatStorage{
    /*
        chats
     */
    private _normal = new Map<number,Chat>();
    private _group = new Map<number,Chat>();

    // add chat to the list
    addChat(chat:Chat):void {
        if(chat.type === 'normalChat'){
            this.normal.set(chat.chatId,chat);
        }else if(chat.type === 'groupChat'){
            this.group.set(chat.chatId,chat);
        }
    }
    // remove chat from the list
    removeChat(chat:Chat):void {
        if(chat.type === 'normalChat'){
            this.normal.delete(chat.chatId);
        }else if(chat.type === 'groupChat'){
            this.group.delete(chat.chatId);
        }
    }
    /*
        the sum of how many chats are stored is returned
     */
    length():number {
        return this.normal.size + this.group.size;
    }
    /*
        value, index , key
     */
    forEach(callback: (value:Chat,key:number) => void):void {

        this.normal.forEach((value:Chat,key:number) => {
            callback(value,key);
        });

        this.group.forEach((value:Chat,key:number) => {
           callback(value,key);
        });
    }
    /*
        the requested chat gets returned
            type: the type of the chat
            id: the id of the chat
     */
    getChat(type:string,id:number):Chat {
        /*
            is the chat a normalchat?
         */
        if(type === 'normalChat'){
            const chat = this.normal.get(id);
            if(chat)
                return chat;
            /*
                is the chat a groupChat?
             */
        }else if(type === 'groupChat'){
            const chat = this.group.get(id);
            if(chat)
                return chat;
        }
        return null;
    }

    get normal(): Map<number,Chat> {
        return this._normal;
    }

    set normal(value: Map<number,Chat>) {
        this._normal = value;
    }

    get group(): Map<number,Chat> {
        return this._group;
    }

    set group(value: Map<number,Chat>) {
        this._group = value;
    }
}