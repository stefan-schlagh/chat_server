export default class Media {

    public meid:number;
    public type:any;
    public pathToFile:any;

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
/*
    get meid() {
        return this._meid;
    }

    set meid(value) {
        this._meid = value;
    }

    get type() {
        return this._type;
    }

    set type(value) {
        this._type = value;
    }

    get pathToFile() {
        return this._pathToFile;
    }

    set pathToFile(value) {
        this._pathToFile = value;
    }*/
}