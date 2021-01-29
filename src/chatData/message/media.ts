export default class Media {

    private _meid:number;
    private _type:any;
    private _pathToFile:any;

    constructor(meid:number,type:any,pathToFile:any) {
        this.meid = meid;
        this.type = type;
        this.pathToFile = pathToFile;
    }
    /*
        media is saved in the database
     */
    async saveMediaInDB(){
        /*
            TODO
         */
    }

    get meid(): number {
        return this._meid;
    }

    set meid(value: number) {
        this._meid = value;
    }

    get type(): any {
        return this._type;
    }

    set type(value: any) {
        this._type = value;
    }

    get pathToFile(): any {
        return this._pathToFile;
    }

    set pathToFile(value: any) {
        this._pathToFile = value;
    }
}