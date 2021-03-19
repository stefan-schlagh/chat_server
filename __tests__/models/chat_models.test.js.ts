import {
    ChangeChatData,
    ChatInfo,
    GroupChatData,
    GroupChatDataOut,
    GroupChatMemberData,
    instanceOfChangeChatData,
    instanceOfChatInfo,
    instanceOfGroupChatData,
    instanceOfGroupChatDataOut,
    instanceOfGroupChatMemberData,
    instanceOfNewChatData,
    instanceOfNewNormalChatData,
    NewChatData,
    NewNormalChatData
} from "../../src/models/chat";
import {messageTypes} from "../../src/models/message";

describe('test chat models type guard',() => {
    describe('test ChatInfo type guard',() => {
        it('success',() => {
            const data:ChatInfo = {
                type: 'normalChat',
                id: 1,
                blockedBySelf: true,
                blockedByOther: true,
                members: [{
                    username:'user1',
                    uid:1
                }],
                chatName: 'abc',
                firstMessage: {
                    date: new Date().toISOString(),
                    canBeShown: true,
                    empty: false,
                    type: messageTypes.normalMessage,
                    content: {
                        text: 'abc'
                    }
                },
                unreadMessages: 0
            }
            expect(instanceOfChatInfo(data)).toEqual(true);
        });
        it('members empty',() => {
            const data:ChatInfo = {
                type: 'normalChat',
                id: 1,
                blockedBySelf: true,
                blockedByOther: true,
                members: [],
                chatName: 'abc',
                firstMessage: {
                    date: new Date().toISOString(),
                    canBeShown: true,
                    empty: false,
                    type: messageTypes.normalMessage,
                    content: {
                        text: 'abc'
                    }
                },
                unreadMessages: 0
            }
            let err = null;
            try {
                instanceOfChatInfo(data)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid ChatInfo')
        });
        it('members invalid',() => {
            const data = {
                type: 'normalChat',
                id: 1,
                blockedBySelf: true,
                blockedByOther: true,
                members: [{username: 1,uid:'abc'}],
                chatName: 'abc',
                firstMessage: {
                    date: new Date().toISOString(),
                    canBeShown: true,
                    empty: false,
                    type: messageTypes.normalMessage,
                    content: {
                        text: 'abc'
                    }
                },
                unreadMessages: 0
            }
            let err = null;
            try {
                instanceOfChatInfo(data)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid SimpleUser')
        });
        it('pass undefined',() => {
            let err = null;
            try {
                instanceOfChatInfo(undefined)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid ChatInfo')
        });
        it('pass null',() => {
            let err = null;
            try {
                instanceOfChatInfo(null)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid ChatInfo')
        });
        it('pass wrong type',() => {
            const data = {
                type: 'a',
                id: '1'
            }
            let err = null;
            try {
                instanceOfChatInfo(data)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid ChatInfo')
        });
    })
    describe('test NewNormalChatData type guard',() => {
        it('success',() => {
            const data:NewNormalChatData = {
                ncid: 1,
                mid: 1
            }
            expect(instanceOfNewNormalChatData(data)).toEqual(true);
        });
        it('pass undefined',() => {
            let err = null;
            try {
                instanceOfNewNormalChatData(undefined)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid NewNormalChatData')
        });
        it('pass null',() => {
            let err = null;
            try {
                instanceOfNewNormalChatData(null)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid NewNormalChatData')
        });
        it('pass wrong type',() => {
            const data = {
                ncid: 'a',
                id: '1'
            }
            let err = null;
            try {
                instanceOfNewNormalChatData(data)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid NewNormalChatData')
        });
    })
    describe('test GroupChatMemberData type guard',() => {
        it('success',() => {
            const data:GroupChatMemberData = {
                uid: 1,
                username: 'user1',
                isAdmin: false
            }
            expect(instanceOfGroupChatMemberData(data)).toEqual(true);
        });
        it('pass undefined',() => {
            let err = null;
            try {
                instanceOfGroupChatMemberData(undefined)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid GroupChatMemberData')
        });
        it('pass null',() => {
            let err = null;
            try {
                instanceOfGroupChatMemberData(null)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid GroupChatMemberData')
        });
        it('pass wrong type - user',() => {
            const data = {
                isAdmin: false,
                username: 'user1',
                uid: '123'
            }
            let err = null;
            try {
                instanceOfGroupChatMemberData(data)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid SimpleUser')
        });
        it('pass wrong type',() => {
            const data = {
                isAdmin: 'false',
                username: 'user1',
                uid: 123
            }
            let err = null;
            try {
                instanceOfGroupChatMemberData(data)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid GroupChatMemberData')
        });
    })
    describe('test GroupChatData type guard',() => {
        it('success',() => {
            const data:GroupChatData = {
                name: 'abc',
                description: 'ab',
                isPublic: true
            }
            expect(instanceOfGroupChatData(data)).toEqual(true);
        });
        it('pass undefined',() => {
            let err = null;
            try {
                instanceOfGroupChatData(undefined)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid GroupChatData')
        });
        it('pass null',() => {
            let err = null;
            try {
                instanceOfGroupChatData(null)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid GroupChatData')
        });
        it('pass wrong type',() => {
            const data = {
                name: 123,
                description: 'ab',
                isPublic: true
            }
            let err = null;
            try {
                instanceOfGroupChatData(data)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid GroupChatData')
        });
    })
    describe('test GroupChatDataOut type guard',() => {
        it('success',() => {
            const data:GroupChatDataOut = {
                name: 'abc',
                description: 'ab',
                isPublic: true,
                id: 123
            }
            expect(instanceOfGroupChatDataOut(data)).toEqual(true);
        });
        it('pass wrong type - GroupChatData',() => {
            const data = {
                name: 123,
                description: 'ab',
                isPublic: true,
                id: 12
            }
            let err = null;
            try {
                instanceOfGroupChatDataOut(data)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid GroupChatData')
        });
        it('pass wrong type',() => {
            const data = {
                name: '123',
                description: 'ab',
                isPublic: true,
                id: false
            }
            let err = null;
            try {
                instanceOfGroupChatDataOut(data)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid GroupChatDataOut')
        });
    })
    describe('test NewChatData type guard',() => {
        it('success',() => {
            const data:NewChatData = {
                type: 'normalChat',
                id: 1,
                members: [{
                    username:'user1',
                    uid:1
                }],
                chatName: 'abc',
                firstMessage: {
                    uid: 1,
                    mid: 1,
                    type: messageTypes.normalMessage,
                    date: 'abc',
                    content: {
                        text: 'abc'
                    }
                },
            }
            expect(instanceOfNewChatData(data)).toEqual(true);
        });
        it('members empty',() => {
            const data:NewChatData = {
                type: 'normalChat',
                id: 1,
                members: [],
                chatName: 'abc',
                firstMessage: {
                    uid: 1,
                    mid: 1,
                    type: messageTypes.normalMessage,
                    date: 'abc',
                    content: {
                        text: 'abc'
                    }
                },
            }
            let err = null;
            try {
                instanceOfNewChatData(data)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid NewChatData')
        });
        it('members invalid',() => {
            const data = {
                type: 'normalChat',
                id: 1,
                members: [{username: 1,uid:'abc'}],
                chatName: 'abc',
                firstMessage: {
                    uid: 1,
                    mid: 1,
                    type: messageTypes.normalMessage,
                    date: 'abc',
                    content: {
                        text: 'abc'
                    }
                }
            }
            let err = null;
            try {
                instanceOfNewChatData(data)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid SimpleUser')
        });
        it('pass undefined',() => {
            let err = null;
            try {
                instanceOfNewChatData(undefined)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid NewChatData')
        });
        it('pass null',() => {
            let err = null;
            try {
                instanceOfNewChatData(null)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid NewChatData')
        });
        it('pass wrong type',() => {
            const data = {
                type: 'a',
                id: '1'
            }
            let err = null;
            try {
                instanceOfNewChatData(data)
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid NewChatData')
        });
    })
    describe('test ChangeChatData type guard',() => {
        it('success',() => {
          const data:ChangeChatData = {
              type: 'a',
              id: 1
          }
          expect(instanceOfChangeChatData(data)).toEqual(true);
        });
        it('pass undefined',() => {
            expect(instanceOfChangeChatData(undefined)).toEqual(false);
        });
        it('pass null',() => {
            expect(instanceOfChangeChatData(null)).toEqual(false);
        });
        it('pass wrong type',() => {
            const data = {
                type: 'a',
                id: '1'
            }
            expect(instanceOfChangeChatData(data)).toEqual(false);
        });
    });
})