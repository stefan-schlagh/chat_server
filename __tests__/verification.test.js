import {toHex,extractParts} from "../src/verification/code";
import {sendMail} from "../src/verification/sendMail";

describe('test Verification', () => {
    it("toHex",() => {
        expect(toHex(2804,8)).toBe("00000af4")
    })
    it('extractParts', async () => {
        const uid = 2804;//0x00000af4
        const code = "aoijf3aiodf5jald7h9fa5j5f6sdgha";
        const uidHex = toHex(uid,8);

        const parts = extractParts(uidHex + code);
        expect(parts.uid).toBe(uid);
        expect(parts.code).toBe(code);
    });
    it("sendMail",async () => {
        await sendMail("stefanjkf.test+jestChat@gmail.com","Test","testMail");
    });
})