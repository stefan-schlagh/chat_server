export interface FileData {
    fid: number,
    mimeType: string,
    realFileName: string,
    serverFileName: string,
    serverFilePath: string,
    date: Date
}
export interface MessageFileData extends FileData {
    mid: number
}
export interface TempMessageFileData extends FileData {
    uid: number
}
export interface FileDataOut {
    fid: number,
    fileName: string,
    mimeType: string
}