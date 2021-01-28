//returns true if the result is empty, null or undefined
export function isResultEmpty(result:any){
    return !result || result.length === 0;
}
//custom error when result is empty
export class ResultEmptyError extends Error{
    constructor() {
        super('result is empty!');
    }
}