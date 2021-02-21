export enum errorTypes {
    userNotExisting,
    userAlreadyExists,
    wrongPassword
}

export class AuthError extends Error {

    private _type:errorTypes;

    constructor(message:string,type:errorTypes) {
        super(message);
        this.type = type;
    }

    get type(): errorTypes {
        return this._type;
    }

    set type(value: errorTypes) {
        this._type = value;
    }
}