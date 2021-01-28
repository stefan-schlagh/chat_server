import {isResultEmpty} from "../../src/util/sqlHelpers";

describe('sqlHelpers test',() => {
    describe('isEmpty',() => {
        it('pass undefined',() => {
            expect(isResultEmpty(undefined)).toEqual(true)
        })
        it('pass null',() => {
            expect(isResultEmpty(null)).toEqual(true)
        })
        it('pass empty array',() => {
            expect(isResultEmpty([])).toEqual(true)
        })
        it('pass array with content',() => {
            expect(isResultEmpty([1,2,3])).toEqual(false)
        })
    })
})