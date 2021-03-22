import {getFileStorageLocation, mkDirIfNotExists, saveFile} from "./file";
import {
    deleteTempMessageFileData,
    getTempMessageFileData,
    saveMessageFileDataInDB,
    saveTempMessageFileDataInDB
} from "../database/files/messageFile";
import {chatTypes} from "../chatData/chat/chat";
import {TempMessageFileData} from "../models/file";
import {rename} from "fs/promises";
import {setServerFilePath} from "../database/files/file";

/*
    save a message file in the database
        at first it is only temporary, because the message does not exist when uploading the file

        returns the temp messageFileId
 */
export async function saveTempMessageFile(
    uid: number,
    mimeType:string,
    realFileName:string,
    stream:any
):Promise<number> {
    // create dir messageFiles if it does not exist
    await mkDirIfNotExists(getFileStorageLocation() + '/tempMessageFiles/');
    // message files are save in a directory grouped by chats
    const serverPath = getFileStorageLocation() + '/tempMessageFiles/' + uid;
    // create dir for user if it does not exist
    await mkDirIfNotExists(serverPath);
    // get mime type
    //const extension = getExtension(realFileName);
    //const mimeType = mime.getType(extension);

    const fileId = await saveFile(realFileName,serverPath,mimeType,stream);

    await saveTempMessageFileDataInDB(fileId, uid);

    return fileId;
}
/*
    the message file is saved, a temporary message file has to be saved already
 */
export async function saveMessageFile(
    fileId:number,
    mid: number,
    chatType:chatTypes,
    chatId:number
):Promise<void> {
    // get data of the temp file
    const tempFileData:TempMessageFileData = await getTempMessageFileData(fileId);
    // create dir messageFiles if it does not exist
    await mkDirIfNotExists(getFileStorageLocation() + '/messageFiles/');
    // message files are save in a directory grouped by chats
    const serverPath = getFileStorageLocation() + '/messageFiles/' + getFolderId(chatType,chatId);
    // create dir for user if it does not exist
    await mkDirIfNotExists(serverPath);
    // move file
    const oldPath = tempFileData.serverFilePath + '/' + tempFileData.serverFileName;
    const newPath = serverPath + '/' + tempFileData.serverFileName;
    await rename(oldPath,newPath)
    // set new path
    await setServerFilePath(fileId,serverPath)
    // save message file
    await saveMessageFileDataInDB(fileId,mid)
    // delete temp message file
    await deleteTempMessageFileData(fileId)
}

export async function readMessageFile(){
    //TODO
}
/*
    folder id is returned
        character + chatId
        normalChats: n[id]
        groupChats: g[id]
 */
function getFolderId(chatType:chatTypes,chatId:number):string {
    if(chatType === chatTypes.normalChat)
        return 'n' + chatId.toString()
    else
        return 'g' + chatId.toString()
}