import {messageTypes} from "../message/message.js";
import MessageStorage from "../message/messageStorage.js";
import NormalMessage from "../message/normalMessage.js";
import StatusMessage from "../message/statusMessage.js";

export class Chat{

    #_type;
    #_messageStorage;
    //wenn -1 --> noch keine Nachrichten im chat
    #_chatId;

    constructor(type,id) {

        if (new.target === Chat)
            throw new TypeError("Cannot construct Abstract instances directly");
        if(this.incrementUnreadMessages === undefined)
            throw new TypeError("Must override function incrementUnreadMessages");
        if(this.getUnreadMessages === undefined)
            throw new TypeError("Must override function getUnreadMessages");

        this.type = type;
        this.chatId = id;

        this.messageStorage = new MessageStorage(this,type,id);
    }
    /*
        neue Message wird zu message-array hinzugefügt
        im Callback wird die msgId zurückgegeben
     */
    async sendMessage(author,data){
        /*
            message is created & initialized
         */
        let message;
        const content = data.content;

        switch(data.type){

            case messageTypes.normalMessage: {
                message = new NormalMessage(this,author);
                /*
                    message is saved in DB, mid is saved
                 */
                await message.initNewMessage(
                    content.text,
                    content.mentions,
                    content.media
                );
                break;
            }
            case messageTypes.statusMessage: {
                message = new StatusMessage(this,author);
                /*
                    message is saved in DB, mid is saved
                 */
                await message.initNewMessage(
                    content.type,
                    content.passiveUsers
                );
                break;
            }
        }

        this.messageStorage.addNewMessage(message);
        /*
            new messages are incremented
         */
        this.incrementUnreadMessages(1);
        /*
            message gets sent to all users
         */
        this.sendToAll(
            author,
            'chat message',
            message.getMessageObject()
        );

        return message.mid;
    }
    /*
        indexes werden vom Arrayende angegeben
        msgIdStart: wenn -1, wird mit der letzten Nachricht angefangen
        num: Anzahl der msg, die geladen werden sollen
     */
    async getMessages(msgIdStart,num){
        /*
            if msgIdStart is -1, it is started with maxMid
         */
        if(msgIdStart === -1)

        if(this.messageStorage.loadedAllMessages){

            return({
                status: 'reached top',
                messages: []
            });
        }

        const mid = await this.messageStorage.getMidBelow(msgIdStart);

        if(mid === -1)
            return({
                status: 'reached top',
                messages: []
            });
        else {
            const messages = await this.messageStorage.getMessagesByMid(mid, num);
            return ({
                status:
                    this.messageStorage.loadedAllMessages
                        ? 'reached top'
                        : 'success',
                messages: messages
            });
        }
    }
    /*
        returns the newest message
     */
    getNewestMessageObject(){

        const firstMessage = this.messages[this.messages.length - 1];
        /*
            does there exist a message?
         */
        if(firstMessage){

            return firstMessage.getMessageObject();
        }else{
            return {
                empty: true
            };
        }
    }

    get type() {
        return this.#_type;
    }

    set type(value) {
        this.#_type = value;
    }

    get messageStorage() {
        return this.#_messageStorage;
    }

    set messageStorage(value) {
        this.#_messageStorage = value;
    }

    get chatId() {
        return this.#_chatId;
    }

    set chatId(value) {
        this.#_chatId = value;
    }
}