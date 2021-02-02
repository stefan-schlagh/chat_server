import BinSearchArray from "../../util/binsearcharray";

export default class ChatStorage{
    /*
        chats
     */
    private _normal = new BinSearchArray();
    private _group = new BinSearchArray();

    //TODO type chat
    addChat(chat:any){
        if(chat.type === 'normalChat'){
            this._normal.add(chat.chatId,chat);
        }else if(chat.type === 'groupChat'){
            this._group.add(chat.chatId,chat);
        }
    }
    //TODO type chat
    removeChat(chat:any){
        if(chat.type === 'normalChat'){
            this._normal.remove(chat.chatId);
        }else if(chat.type === 'groupChat'){
            this._group.remove(chat.chatId);
        }
    }
    /*
        the sum of how many chats are stored is returned
     */
    length(){
        return this._normal.length + this._group.length;
    }
    /*
        value, index , key
     */
    forEach(callback:any){

        for(let i:number=0; i<this._normal.length; i++){
            const val = this._normal[i].value;
            callback(val,i,this._normal[i].key,val.type);
        }
        for(let i=0; i<this._group.length; i++){
            const val = this._group[i].value;
            callback(val,i,this._group[i].key,val.type);
        }
    }
    /*
        value, index , key
     */
    forEachGroup(callback:any){
        for(let i=0; i<this._group.length; i++){
            callback(this._group[i].value,i,this._group[i].key);
        }
    }
    /*
        the requested chat gets returned
            type: the type of the chat
            id: the id of the chat
     */
    getChat(type:string,id:number){
        /*
            is the chat a normalchat?
         */
        if(type === 'normalChat'){
            const chat = this._normal.get(id);
            if(chat)
                return chat;
            /*
                is the chat a groupChat?
             */
        }else if(type === 'groupChat'){
            const chat = this._group.get(id);
            if(chat)
                return chat;
        }
        return null;
    }

    get normal(): BinSearchArray {
        return this._normal;
    }

    set normal(value: BinSearchArray) {
        this._normal = value;
    }

    get group(): BinSearchArray {
        return this._group;
    }

    set group(value: BinSearchArray) {
        this._group = value;
    }
}