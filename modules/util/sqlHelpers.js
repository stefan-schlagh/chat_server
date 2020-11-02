//returns true if the result is empty, null or undefined
export function isResultEmpty(result){
    return !result || result.length === 0;
}
//custom error when result is empty
export class ResultEmptyError extends Error{
    constructor() {
        super('result is undefined!');
    }
}