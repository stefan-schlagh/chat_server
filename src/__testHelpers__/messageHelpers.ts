import {LoadedMessages, MessageDataOut, messageTypes} from "../models/message";

export const findMessage = (text:string,messages:LoadedMessages):boolean => {
    for(let i = 0;i < messages.messages.length;i++){
        const message:MessageDataOut = messages.messages[i];
        if(message.type === messageTypes.normalMessage)
            if ("text" in message.content && message.content.text === text)
                return true;
    }
    return false;
};