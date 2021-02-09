import {ChangeChatData, instanceOfChangeChatData} from "../../src/models/chat";

describe('test chat models type guard',() => {
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