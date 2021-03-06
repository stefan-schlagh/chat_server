import {
    instanceOfSimpleUser,
    instanceOfUserInfo,
    instanceOfUserInfoSelf,
    SimpleUser,
    UserInfo, UserInfoSelf
} from "../../src/models/user";

describe('user models test',() => {
   describe('SimpleUser test',() => {
      it('success',() => {
         const data:SimpleUser = {
             uid: 1,
             username: 'abc'
         };
         expect(instanceOfSimpleUser((data))).toEqual(true);
      });
      it('invalid',() => {
          const data = {
              uid: 1,
              username: 2
          };
          let err:Error = null;
          try {
              instanceOfSimpleUser(data);
          }catch (e) {
              err = e;
          }
          expect(err).not.toEqual(null);
          expect(err instanceof TypeError);
          expect(err.message).toEqual('invalid SimpleUser');
      });
   });
    describe('UserInfo test',() => {
        it('success',() => {
            const data:UserInfo = {
                username: 'abc',
                userExists: true,
                blockedBySelf: false,
                blockedByOther: false,
                groups: []
            };
            expect(instanceOfUserInfo((data))).toEqual(true);
        });
        it('invalid',() => {
            const data = {
                username: 'abc',
                userExists: true,
                blockedBySelf: false,
                blockedByOther: false
            };
            let err:Error = null;
            try {
                instanceOfUserInfo(data);
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid UserInfo');
        });
        it('invalid UserBlockInfo',() => {
            const arr:any = [];
            const data = {
                username: 'abc',
                userExists: true,
                blockedBySelf: 'false',
                blockedByOther: false,
                groups: arr
            };
            let err:Error = null;
            try {
                instanceOfUserInfo(data);
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid UserBlockInfo');
        });
    });
    describe('UserInfoSelf test',() => {
        it('success',() => {
            const data:UserInfoSelf = {
                uid: 1,
                username: 'abc',
                email: 'string',
                emailVerified: true,
                accountCreationTime: 'string',
            };
            expect(instanceOfUserInfoSelf((data))).toEqual(true);
        });
        it('invalid',() => {
            const data = {
                uid: 1,
                username: '123',
                email: 'abc'
            };
            let err:Error = null;
            try {
                instanceOfUserInfoSelf(data);
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid UserInfoSelf');
        });
        it('invalidSimpleUser',() => {
            const data = {
                uid: 1,
                username: 12,
                email: 'string',
                emailVerified: true,
                accountCreationTime: 'string',
            };
            let err:Error = null;
            try {
                instanceOfUserInfoSelf(data);
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
            expect(err.message).toEqual('invalid SimpleUser');
        });
    });
});