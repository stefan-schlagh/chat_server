import {instanceOfRegisterData, RegisterData} from "../../src/models/auth";

describe('auth models test',() => {
    describe('register',() => {
       it('success without email',() => {
           const data:RegisterData = {
               username: 'username',
               password: 'password'
           }
           expect(instanceOfRegisterData(data)).toEqual(true);
       });
        it('success with email',() => {
            const data:RegisterData = {
                username: 'username',
                password: 'password',
                email: 'email@test.com'
            }
            expect(instanceOfRegisterData(data)).toEqual(true);
        });
        it('error - email',() => {
            const data:RegisterData = {
                username: 'username',
                password: 'password',
                email: 'email.com'
            }
            let err = null;
            try {
                instanceOfRegisterData(data);
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
        });
        it('error - username',() => {
            const data = {
                password: 'password',
                email: 'email.com'
            }
            let err = null;
            try {
                instanceOfRegisterData(data);
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
        });
        it('error - password',() => {
            const data = {
                username: 'username',
                email: 'email.com'
            }
            let err = null;
            try {
                instanceOfRegisterData(data);
            }catch (e) {
                err = e;
            }
            expect(err).not.toEqual(null);
            expect(err instanceof TypeError);
        });
    });
})