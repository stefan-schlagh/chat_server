export default class Media {

    #_meid;
    #_type;
    #_pathToFile;

    constructor(meid,type,pathToFile) {
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
    }
}