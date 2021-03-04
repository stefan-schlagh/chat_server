import {
    instanceOfLoadedMessages, instanceOfMessageContent,
    instanceOfMessageDataIn,
    instanceOfMessageDataOut,
    instanceOfNewMessageData,
    instanceOfNewMessageReturn, instanceOfNormalMessageContent, instanceOfStatusMessageContent,
    LoadedMessages, Media, Mention,
    MessageDataIn,
    messageTypes,
    NewMessageData,
    NewMessageReturn,
    statusMessageTypes
} from "../../src/models/message";

describe('message models test',() => {
   it('newMessageData',() => {
      const data:NewMessageData = {
          chatType: 'normalChat',
          chatId: 1,
          message: {
              type: messageTypes.normalMessage.valueOf(),
              content: {
                  media: [],
                  mentions: [],
                  text: 'message'
              }
          }
      }
      expect(instanceOfNewMessageData(data)).toEqual(true);
   });
    it('newMessageData - invalid',() => {
        const data = {
            chatType: 'normalChat',
            chatId: '1',
            message: {
                type: messageTypes.normalMessage.valueOf(),
                content: {
                }
            }
        }
        let err = null;
        try {
            instanceOfNewMessageData(data);
        }catch (e) {
            err = e;
        }
        expect(err).not.toEqual(null);
        expect(err instanceof TypeError);
    });
    it('MessageDataIn',() => {
       const data:MessageDataIn = {
           type: messageTypes.normalMessage.valueOf(),
           content: {
               media: [],
               mentions: [],
               text: 'message'
           }
       }
       expect(instanceOfMessageDataIn(data)).toEqual(true);
    });
    it('MessageDataIn - invalid',() => {
        const data = {
            type: messageTypes.normalMessage.valueOf().toString(),
            content: {
            }
        }
        let err = null;
        try {
            instanceOfMessageDataIn(data);
        }catch (e) {
            err = e;
        }
        expect(err).not.toEqual(null);
        expect(err instanceof TypeError);
    });
    it('MessageDataOut - invalid',() => {
        const data = {
            type: messageTypes.normalMessage.valueOf(),
            content: {
            }
        }
        let err = null;
        try {
            instanceOfMessageDataOut(data);
        }catch (e) {
            err = e;
        }
        expect(err).not.toEqual(null);
        expect(err instanceof TypeError);
    });
   it('newMessageReturn',() => {
      const data:NewMessageReturn = {
          mid: 1
      }
      expect(instanceOfNewMessageReturn(data)).toEqual(true);
   });
    it('newMessageReturn - invalid',() => {
        const data = {
            mid: '1'
        }
        let err = null;
        try {
            instanceOfNewMessageReturn(data);
        }catch (e) {
            err = e;
        }
        expect(err).not.toEqual(null);
        expect(err instanceof TypeError);
    });
   it('LoadedMessages 1',() => {
       const data:LoadedMessages = {
           status:'',
           messages: []
       }
       expect(instanceOfLoadedMessages(data)).toEqual(true);
   });
    it('LoadedMessages 2',() => {
        const data:LoadedMessages = {
            status:'',
            messages: [
                {
                    mid: 1,
                    uid: 1,
                    date: new Date(Date.now()).toISOString(),
                    type: 0,
                    content: {
                        type: statusMessageTypes.chatCreated,
                        passiveUsers:[1,2]
                    }
                }
            ]
        }
        expect(instanceOfLoadedMessages(data)).toEqual(true);
    });
    it('LoadedMessages - invalid',() => {
        const data = {
            status: 0,
            messages: [
                {
                    mid: 1,
                    uid: 1,
                    date: new Date(Date.now()).toISOString(),
                    type: 0,
                    content: {}
                }
            ]
        }
        let err = null;
        try {
            instanceOfLoadedMessages(data);
        }catch (e) {
            err = e;
        }
        expect(err).not.toEqual(null);
        expect(err instanceof TypeError);
    });
    it('(status) messageContent - success',() => {
        const data = {
            type: statusMessageTypes.chatCreated,
            passiveUsers: [1,2]
        }
        expect(instanceOfMessageContent(data)).toEqual(true);
        expect(instanceOfStatusMessageContent(data)).toEqual(true);
    });
    it('(status) messageContent - invalid',() => {
        const data = {
            type: "abc",
            passiveUsers: [1,2]
        }
        expect(instanceOfMessageContent(data)).toEqual(false);
        expect(instanceOfStatusMessageContent(data)).toEqual(false);
    });
    it('(normal) messageContent - success',() => {
        const mentions:Mention[] = [];
        const media:Media[] = [];
        const data = {
            text: "abc",
            mentions: mentions,
            media: media
        }
        expect(instanceOfMessageContent(data)).toEqual(true);
        expect(instanceOfNormalMessageContent(data)).toEqual(true);
    });
    it('(normal) messageContent - invalid',() => {
        const data = {
            type: "abc",
            passiveUsers: [1,2]
        }
        expect(instanceOfMessageContent(data)).toEqual(false);
        expect(instanceOfNormalMessageContent(data)).toEqual(false);
    });
});