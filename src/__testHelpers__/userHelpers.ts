import request, {Response} from "supertest";
import {app} from "../app";
import {GroupChatMemberDataAll} from "../models/chat";

export interface AccountInfo {
    uid: number,
    username: string,
    tokens: string
}
/*
    init a account, use default password 'password'
    if account does not exit: register
    else: login
 */
export async function initAccount(username:string):Promise<AccountInfo> {
    const res:Response = await request(app)
        .post('/auth/register')
        .send({
            username: username,
            password: "password"
        })
    expect(res.status).toEqual(200)

    if(res.body.success) {
        expect(res.body).toHaveProperty('tokens')
        return {
            uid: res.body.uid,
            username: username,
            tokens: res.body.tokens
        }
    }else{
        if (res.body.username === "Username already taken"){
            const res = await request(app)
                .post('/auth/login')
                .send({
                    username: username,
                    password: "password"
                })
            expect(res.status).toEqual(200)
            expect(res.body).toHaveProperty('tokens')
            return {
                uid: res.body.uid,
                username: username,
                tokens: res.body.tokens
            }
        }else {
            fail('unknown error');
        }
    }
}
/*
    find a user by its id, return the name
 */
export function findUserName(uid:number,members: GroupChatMemberDataAll[]):string {
    for(let i = 0;i < members.length;i++){
        if(members[i].uid == uid)
            return members[i].username;
    }
    return '';
}