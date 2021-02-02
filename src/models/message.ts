import {messageTypes} from "../chatData/message/message";
import {statusMessageTypes} from "../chatData/message/statusMessage";

export interface MessageData {
    type: messageTypes,
    // TODO: find a better way of doing this
    content: any
}
export interface NormalMessageContent {
    text: string
    mentions: Mention[],
    media: Media[]
}
export interface StatusMessageContent {
    type: statusMessageTypes,
    // a array with user ids
    passiveUsers: number[]
}
// TODO
export interface Mention {
    // the user id of the mentioned user
    uid: number,
    textColumn: number
}
export interface Media {
    type: number,
    pathToFile: string
}