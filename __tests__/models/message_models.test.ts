import {
    instanceOfLoadedMessages,
    instanceOfMessageContentIn,
    instanceOfMessageContentOut,
    instanceOfMessageDataIn,
    instanceOfMessageDataOut,
    instanceOfNewMessageData,
    instanceOfNewMessageReturn,
    instanceOfNormalMessageContentIn,
    instanceOfNormalMessageContentOut,
    instanceOfStatusMessageContent,
    LoadedMessages, MessageContentIn, MessageContentOut,
    MessageDataIn,
    messageTypes,
    NewMessageData,
    NewMessageReturn,
    statusMessageTypes
} from "../../src/models/message";

describe('message models test',() => {
    describe('newMessageData',() => {
        it('newMessageData', () => {
            const data: NewMessageData = {
                chatType: 'normalChat',
                chatId: 1,
                message: {
                    type: messageTypes.normalMessage.valueOf(),
                    content: {
                        text: 'message',
                        files: []
                    }
                }
            }
            expect(instanceOfNewMessageData(data)).toEqual(true);
        });
        it('newMessageData - invalid', () => {
            const data = {
                chatType: 'normalChat',
                chatId: '1',
                message: {
                    type: messageTypes.normalMessage.valueOf(),
                    content: {}
                }
            }
            let err = null;
            try {
                instanceOfNewMessageData(data);
            } catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
        });
    });
    describe('MessageDataIn',() => {
        it('MessageDataIn', () => {
            const data: MessageDataIn = {
                type: messageTypes.normalMessage.valueOf(),
                content: {
                    text: 'message',
                    files: []
                }
            }
            expect(instanceOfMessageDataIn(data)).toEqual(true);
        });
        it('MessageDataIn - invalid', () => {
            const data = {
                type: messageTypes.normalMessage.valueOf().toString(),
                content: {}
            }
            let err = null;
            try {
                instanceOfMessageDataIn(data);
            } catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
        })
    })
    describe('MessageDataOut',() => {
        it('MessageDataOut - invalid', () => {
            const data = {
                type: messageTypes.normalMessage.valueOf(),
                content: {}
            }
            let err = null;
            try {
                instanceOfMessageDataOut(data);
            } catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
        });
    })
    describe('newMessageReturn',() => {
        it('newMessageReturn', () => {
            const data: NewMessageReturn = {
                mid: 1
            }
            expect(instanceOfNewMessageReturn(data)).toEqual(true);
        });
        it('newMessageReturn - invalid', () => {
            const data = {
                mid: '1'
            }
            let err = null;
            try {
                instanceOfNewMessageReturn(data);
            } catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
        });
    })
    describe('LoadedMessages', () => {
        it('LoadedMessages 1', () => {
            const data: LoadedMessages = {
                status: '',
                messages: []
            }
            expect(instanceOfLoadedMessages(data)).toEqual(true);
        });
        it('LoadedMessages 2', () => {
            const data: LoadedMessages = {
                status: '',
                messages: [
                    {
                        mid: 1,
                        uid: 1,
                        date: new Date(Date.now()).toISOString(),
                        type: 0,
                        content: {
                            type: statusMessageTypes.chatCreated,
                            passiveUsers: [1, 2]
                        }
                    }
                ]
            }
            expect(instanceOfLoadedMessages(data)).toEqual(true);
        });
        it('LoadedMessages - invalid', () => {
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
            } catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
        });
    });
    describe('MessageContentIn', () => {
        it('(status) messageContentIn - success', () => {
            const data = {
                type: statusMessageTypes.chatCreated,
                passiveUsers: [1, 2]
            }
            expect(instanceOfMessageContentIn(data)).toEqual(true);
            expect(instanceOfStatusMessageContent(data)).toEqual(true);
        });
        it('(status) messageContentIn - invalid', () => {
            const data = {
                type: "abc",
                passiveUsers: [1, 2]
            }
            expect(instanceOfMessageContentIn(data)).toEqual(false);
            expect(instanceOfStatusMessageContent(data)).toEqual(false);
        });
        it('(normal) messageContentIn - success', () => {
            const data:MessageContentIn = {
                text: "abc",
                files: [1,2]
            }
            expect(instanceOfMessageContentIn(data)).toEqual(true);
            expect(instanceOfNormalMessageContentIn(data)).toEqual(true);
        });
        it('(normal) messageContentIn - invalid', () => {
            const data = {
                type: "abc",
                passiveUsers: [1, 2]
            }
            expect(instanceOfMessageContentIn(data)).toEqual(false);
            expect(instanceOfNormalMessageContentIn(data)).toEqual(false);
        });
    })
    describe('MessageContentOut', () => {
        it('(normal) messageContentOut - success', () => {
            const data:MessageContentOut = {
                text: "abc",
                files: []
            }
            expect(instanceOfMessageContentOut(data)).toEqual(true);
            expect(instanceOfNormalMessageContentOut(data)).toEqual(true);
        });
        it('(normal) messageContentOut - invalid', () => {
            const data = {
                type: "abc",
                passiveUsers: [1, 2]
            }
            expect(instanceOfMessageContentOut(data)).toEqual(false);
            expect(instanceOfNormalMessageContentOut(data)).toEqual(false);
        });
    })
});