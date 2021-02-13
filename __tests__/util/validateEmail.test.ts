import {validateEmail} from "../../src/util/validateEmail";

describe("validate email",() => {
    it("success",() => {
      expect(validateEmail("test@test.com")).toEqual(true);
    });
    it("fail 1",() => {
        expect(validateEmail("test")).toEqual(false);
    });
    it("fail 2",() => {
        expect(validateEmail("test.a")).toEqual(false);
    });
    it("fail 3",() => {
        expect(validateEmail("@b.com")).toEqual(false);
    });
});