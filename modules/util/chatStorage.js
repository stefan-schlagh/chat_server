import BinSearchArray from "binsearcharray";

export default class ChatStorage{

    #_normal = new BinSearchArray();
    #_group = new BinSearchArray();


    addChat(chat){
        if(chat.type === 'normalChat'){
            this.normal.add(chat.chatId,chat);
        }else if(chat.type === 'groupChat'){
            this.group.add(chat.chatId,chat);
        }
    }

    removeChat(chat){
        if(chat.type === 'normalChat'){
            this.normal.remove(chat.chatId);
        }else if(chat.type === 'groupChat'){
            this.group.remove(chat.chatId);
        }
    }
    /*
        the sum of how many chats are stored is returned
     */
    length(){
        return this.normal.length + this.group.length;
    }
    /*
        value, index , key
     */
    forEach(callback){

        for(let i=0;i<this.normal.length;i++){
            const val = this.normal[i].value;
            callback(val,i,this.normal[i].key,val.type);
        }
        for(let i=0;i<this.group.length;i++){
            const val = this.group[i].value;
            callback(val,i,this.group[i].key,val.type);
        }
    }
    /*
        value, index , key
     */
    forEachGroup(callback){
        for(let i=0;i<this.group.length;i++){
            callback(this.group[i].value,i,this.group[i].key);
        }
    }

    get normal() {
        return this.#_normal;
    }

    set normal(value) {
        this.#_normal = value;
    }

    get group() {
        return this.#_group;
    }

    set group(value) {
        this.#_group = value;
    }
}