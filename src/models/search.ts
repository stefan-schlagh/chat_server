export interface SearchData {
    search: string,
    limit: number,
    start: number
}
// type check
export function instanceOfSearchData(object: any): object is SearchData {
    if(!(
        typeof object === 'object'
        && 'search' in object && typeof object.search === 'string'
        && 'limit' in object && typeof object.limit === 'number'
        && 'start' in object && typeof object.start === 'number'
    ))
        throw new TypeError('invalid SearchData');
    return true;
}