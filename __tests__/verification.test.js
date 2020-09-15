import {toHex,extractParts} from "../modules/verification/code";

describe('test Verification', () => {
    it("toHex",() => {
        expect(toHex(2804,8)).toBe("00000af4")
    })
    it('extractParts', async () => {
        const uid = 2804;//0x00000af4
        const hash = "aoijf3aiodf5jald7h9fa5j5f6sdgha";

        //extractParts()
        const num = 255;
        expect(num.toString(16)).toBe("ff");
    });
});