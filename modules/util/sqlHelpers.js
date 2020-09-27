//returns true if the result is empty
export function isEmpty(result){
    return !result || result.length === 0;
}
export function createEmptyError(){
    return new Error("result is undefined!")
}