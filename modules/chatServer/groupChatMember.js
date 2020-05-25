export default class GroupChatMember{

    #_user;
    #_isAdmin;

    constructor(user,isAdmin) {

        this.user = user;
        this.isAdmin = isAdmin;
    }

    get user() {
        return this.#_user;
    }

    set user(value) {
        this.#_user = value;
    }

    get isAdmin() {
        return this.#_isAdmin;
    }

    set isAdmin(value) {
        this.#_isAdmin = value;
    }
}