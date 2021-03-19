import {comparePassword, hashPassword} from "../../src/authentication/bcryptWrappers";

describe('authentication test',() => {
    describe('bcryptWrappers', () => {
        it('test bcryptWrappers', async () => {
            //hash
            const hash = await hashPassword('secretPassword');
            //compare
            expect(await comparePassword('secretPassword', hash)).toEqual(true);
        })
    })
});