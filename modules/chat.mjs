import Message from "./message.mjs";
import {chatServer} from "./chat_server.mjs";

export class Chat{


    #_type;
    #_messages = [];
    //wenn -1 --> noch keine Nachrichten im chat
    #_maxMid;
    #_chatId;

    constructor(type,id) {
        this.type = type;
        this.chatId = id;
    }
    /*
        neue Message wird zu message-array hinzugefügt
        im Callback wird die msgId zurückgegeben
     */
    sendMessage(author,msg,callback){
        const newMsg = new Message(this,author,msg);
        newMsg.saveInDB(msgId => {
            /*
                neue msg, daher ist maxMid auch höher
             */
            this.maxMid = msgId;
            callback(msgId);
        });
        this.messages.push(newMsg);
    }
    /*
        messages werden initialisiert
     */
    initMessages(callback){
        /*
            es wird die in der DB gespeicherte Nachricht mit der höchsten messageId für diesen chat gesucht
         */
        const isGroupchat = this.type === 'groupChat';
        chatServer.con.query("SELECT max(mid) AS 'mid' FROM message ;"/*WHERE isGroupChat = '"+isGroupchat+"' && cid = '"+this.chatId+"';"*/,
        (err,result,fields) => {
            if(result[0].mid !== null) {
                this.maxMid = result[0].mid;
                this.loadMessages(10,callback);
            }
            else
                this.maxMid = -1;
        });
    }
    /*
        Messages werden geladen
        @param num Anzahl der Nachrichten, die geladen werden sollen
     */
    loadMessages(num,callback){
        const isGroupchat = this.type === 'groupChat';
        chatServer.con.query("SELECT * FROM message WHERE isGroupChat = '"+isGroupchat+"' && cid = '"+this.chatId+"' && mid < "+this.getLowestMsgId()+" ORDER BY mid DESC LIMIT "+num+";",
        (err,result,fields) => {
            /*
                wenn weniger Ergebnisse bei SQL-query, wie num, ist das Ende des chats erreicht
                ,alle Nachrichten sind geladen
             */
            if (result !== undefined) {
                const reachedTop = num > result.length;
                const resCount = result.length;
                for (let i = 0; i < result.length; i++) {
                    /*
                        neue Message wird am start vom Array eingefügt
                     */
                    const message = new Message(this, chatServer.user[result[i].uid], result[i].content, result[i].mid);
                    message.date = mysqlTimeStampToDate(result[i].date);
                    this.messages.unshift(message);
                }
                callback(resCount, reachedTop);
            }else{
                callback(0,true);
            }
        });
        /*
            source: https://dzone.com/articles/convert-mysql-datetime-js-date
         */
        function mysqlTimeStampToDate(timestamp) {

            /*
                function parses mysql datetime string and returns javascript Date object
                input has to be in this format: 2007-06-05 15:26:02
             */
            const regex=/^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9]) (?:([0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?$/;
            const parts=timestamp.replace(regex,"$1 $2 $3 $4 $5 $6").split(' ');
            return new Date(parts[0],parts[1]-1,parts[2],parts[3],parts[4],parts[5]);
        }
    }
    /*
        alle msg, kleiner als lowestMsgId werden geladen
     */
    getLowestMsgId(){
        if(this.messages[0] === undefined)
            return this.maxMid+1;
        return this.messages[0].msgId;
    }
    /*
        es wird der index der gegebenen msgId ermittelt
     */
    getIndexOfMsgId(msgId){
        for(let i=this.messages.length-1;i>=0;i--){
            if(this.messages[i].msgId === msgId)
                return i;
        }
        //not found
        return -1;
    }
    /*
        indexes werden vom Arrayende angegeben
        msgIdStart: wenn -1, wird mit der letzten Nachricht angefangen
        num: Anzahl der msg, die geladen werden sollen
     */
    getMessages(msgIdStart,num,callback){
        let indexOfMsgId;
        /*
            bei client noch keine Nachrichten vorhanden
         */
        if(msgIdStart === -1) {
            //wenn maxMid -1 --> noch keine Nachrichten vorhanden
            if(this.maxMid === -1){
                /*
                    leeres Array wird zurückgegeben, noch keine Nachrichten vorhanden
                */
                callback({
                    chatType: this.type,
                    chatId: this.chatId,
                    status: 'no msg found',
                    messages: []
                });
            }
            indexOfMsgId = this.messages.length;
        }
        else
            indexOfMsgId = this.getIndexOfMsgId(msgIdStart);

        if(indexOfMsgId !== -1){
            /*
                es wird der Bereich ausgegeben
             */
            const loopResult = (indexStart,iNum,reachedTop) => {
                const arr = new Array(iNum);
                for(let i=indexStart,j=iNum-1;i>indexStart-iNum && j>=0;i--,j--){
                    /*
                        msg-Objekt wird erstellt
                     */
                    arr[j] = {
                        uid: this.messages[i].author.uid,
                        mid: this.messages[i].msgId,
                        date: this.messages[i].date,
                        content: this.messages[i].msg
                    };
                }
                callback({
                    chatType: this.type,
                    chatId: this.chatId,
                    status: reachedTop?'reached top':'success',
                    messages: arr
                });
            };
            /*
                es wird geschaut, ob die messages auch im Server existieren. Wenn nicht, werden sie aus der DB geladen
             */
            if(indexOfMsgId<num)
                /*
                    messages werden geladen
                    num - msgIdStart --> Anzahl der zu ladenden Nachrichten
                    callback:
                            rNum: Anzahl der tatsächlich geladenen
                            reachedTop: wurden bereits alle Nachrichten geladen?
                 */
                this.loadMessages(num-indexOfMsgId,(rNum,reachedTop) => {
                    /*
                        num: Zahl der messages, die geladen werden sollte
                            - Zahl der messages die aus DB geladen werden sollen
                            + Zahl der messages die tatsächlich aus DB geladen wurde
                     */
                    loopResult(indexOfMsgId-1+rNum,num-(num-indexOfMsgId)+rNum,reachedTop);
                });
            else
                loopResult(indexOfMsgId-1,num,false);
        }else{
            /*
                leeres Array wird zurückgegeben
             */
            callback({
                chatType: this.type,
                chatId: this.chatId,
                status: 'error',
                messages: []
            });
        }
    }

    get type() {
        return this.#_type;
    }

    set type(value) {
        this.#_type = value;
    }

    get messages() {
        return this.#_messages;
    }

    set messages(value) {
        this.#_messages = value;
    }

    get maxMid() {
        return this.#_maxMid;
    }

    set maxMid(value) {
        this.#_maxMid = value;
    }

    get chatId() {
        return this.#_chatId;
    }

    set chatId(value) {
        this.#_chatId = value;
    }
}

export class NormalChat extends Chat{

    #_user1;
    #_user2;

    constructor(chatId,user1,user2) {
        super('normalChat',chatId);
        this.user1 = user1;
        this.user2 = user2;
    }

    get user1(){
        return this.#_user1;
    }
    get user2(){
        return this.#_user2;
    }
    set user1(user1){
        this.#_user1 = user1;
    }
    set user2(user2){
        this.#_user2 = user2;
    }

    sendMessage(sentBy,msg,callback) {
        super.sendMessage(sentBy,msg,msgId => {
            /*
                Nachricht wird an den user geschickt, der nicht der Author ist
                callback wird mit msgId aufgerufen
                chatID, msgId und content wird mitgeliefert
            */
            callback(msgId);
            this.sendToAll(sentBy,'chat message',msg,msgId);
        });
    }
    sendToAll(sentBy,type,content,mid = -1){
        const data = {
            type: this.type,
            id: this.chatId,
            uid: sentBy.uid,
            mid: mid,
            content: content
        };
        /*
            es wird der user, der nicht der Sender ist, definiert
         */

        if(this.user1.uid===sentBy.uid){
            /*
                es wird geschaut, ob Socket definiert ist
             */
            if(this.user2.socket != null)
                chatServer.io.to(this.user2.socket.id).emit(type,data);
        }
        else {
            /*
                es wird geschaut, ob Socket definiert ist
             */
            if(this.user1.socket != null)
                chatServer.io.to(this.user1.socket.id).emit(type,data);
        }
    }
    isAnyoneOnline(){
        return this.user1.online || this.user2.online;
    }
    removeUsers(uid){
        /*
            es wird der user ermittelt, der nicht die uid hat
         */
        let user;
        if(this.user1.uid === uid)
            user = this.user2;
        else if(this.user2 === uid)
            user = this.user1;
        /*
            wenn keine anderen Chats verhanden, wird user gelöscht
         */
        if(user.chats.length <= 1){
            chatServer.user[user.uid] = undefined;
        }
        /*
            sonst wird chat entfernt
         */
        else{
            user.removeUnloadedChat(this);
        }
    }
}

export class GroupChat extends Chat{

    #_users;
    #_chatName;
    #_socketRoomName;

    constructor(chatId, users, chatName, socketRoomName) {
        super('groupChat',chatId);
        this.users = users;
        this.chatName = chatName;
        this.socketRoomName = socketRoomName;
    }

    get users() {
        return this.#_users;
    }

    set users(value) {
        this.#_users = value;
    }
    get chatName() {
        return this.#_chatName;
    }

    set chatName(value) {
        this.#_chatName = value;
    }

    get socketRoomName() {
        return this.#_socketRoomName;
    }

    set socketRoomName(value) {
        this.#_socketRoomName = value;
    }
    sendMessage(sentBy,msg) {
        super.sendMessage(sentBy,msg);
        //TODO
        /*
            msg gets emitted to all users
         */
    }
    sendToAll(sentBy,type,content){

    }
    isAnyoneOnline(){
        for(let i=0;i<this.users.length;i++){
            if(this.users[i].online)
                return true;
        }
        return false;
    }
    removeUsers(uid){
        for(let i=0;i<this.users.length;i++){
            if(this.users[i].uid !== uid) {
                /*
                    wenn keine anderen Chats verhanden, wird user gelöscht
                 */
                if (this.users[i].chats.length <= 1) {
                    chatServer.user[this.users[i].uid] = undefined;
                }
                /*
                    sonst wird chat entfernt
                 */
                else {
                    this.users[i].removeUnloadedChat(this);
                }
            }
        }
    }
}

/*module.exports.Chat = Chat;
module.exports.NormalChat = NormalChat;
module.exports.GroupChat = GroupChat;*/