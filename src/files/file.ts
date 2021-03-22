import * as fs from 'fs';
import pump from 'pump';
import * as zlib from 'zlib';
import {constants} from 'fs';
import {access, mkdir} from 'fs/promises';
import {saveFileDataInDB, setServerFileName} from "../database/files/file";

/*
    save a file on the server
        returns the file id
 */
export async function saveFile(
    realFileName:string,
    destPath:string,
    mimeType:string,
    stream:any
):Promise<number> {

    const extension = getExtension(realFileName)
    const fileNameWithoutExtension = getFileNameWithoutExtension(realFileName);

    const fileId:number = await saveFileDataInDB(mimeType,realFileName,'',destPath);

    let serverFileName:string = fileNameWithoutExtension

    // filename on server is max. 200 chars
    if(fileNameWithoutExtension.length > 200)
        serverFileName = fileNameWithoutExtension.substring(0,200);

    serverFileName += '_' + fileId + '.' + extension + '.gz';
    // set new serverFileName
    await setServerFileName(fileId,serverFileName)

    const gzip = zlib.createGzip();
    const write = fs.createWriteStream(destPath + '/' + serverFileName);

    await new Promise<void>((resolve, reject) => {
        // save zipped file
        pump(stream,gzip,write,(err:Error) => {
            if(err)
                reject(err)
            else
                resolve()
        })
    })

    return fileId;
}

export async function readFile(fileId:number){
    //TODO
}
export function getExtension(fileName:string):string {
    return fileName.replace(/^(?:[^/.]+\.)*/,"");
}
// https://stackoverflow.com/a/4250408/12913973
export function getFileNameWithoutExtension(fileName:string):string {
    return fileName.replace(/\.[^/.]+$/, "")
}
export async function doesFileExist(file:string):Promise<boolean> {
    try {
        await access(file, constants.R_OK | constants.W_OK);
        return true;
    } catch(err) {
        return false;
    }
}
// create dir if it does not exist
export async function mkDirIfNotExists(dir:string):Promise<void> {
    try {
        await access(dir, constants.R_OK | constants.W_OK);
    } catch {
        await mkdir(dir);
    }
}
export function getFileStorageLocation():string {
    return process.env.FILE_STORAGE_LOCATION
}