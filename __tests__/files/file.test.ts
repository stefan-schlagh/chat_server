import {
    doesFileExist,
    getExtension,
    getFileNameWithoutExtension,
    mkDirIfNotExists,
    saveFile
} from "../../src/files/file";
import * as fs from "fs";
import * as mime from 'mime';
import {closeServer, startServer} from "../../src/app";
import {getFileData} from "../../src/database/files/file";
import {FileData, MessageFileData, TempMessageFileData} from "../../src/models/file";
import {saveMessageFile, saveTempMessageFile} from "../../src/files/messageFile";
import {chatTypes} from "../../src/chatData/chat/chat";
import {getMessageFileData, getTempMessageFileData} from "../../src/database/files/messageFile";

describe('files test',() => {
    beforeAll((done) => {
        startServer();
        done();
    });
    afterAll((done) => {
        closeServer();
        done();
    });
    describe('file', () => {
        let fileId:number;
        it('should save file', async () => {
            const readStream = fs.createReadStream(process.env.APP_HOME_PATH + '/test/files/test.txt')
            const filePath = process.env.FILE_STORAGE_LOCATION + '/testfiles'
            await mkDirIfNotExists(filePath)
            fileId = await saveFile(
                'test.txt',
                filePath,
                mime.getType('txt'),
                readStream
            );
            expect(typeof fileId).toEqual("number")
        });
        it('file should exist',async () => {
            expect(typeof fileId).toEqual("number")
            const file:FileData = await getFileData(fileId)
            const filePath = file.serverFilePath + '/' + file.serverFileName
            expect(await doesFileExist(filePath)).toEqual(true)
        })
    });
    describe('messageFile',() => {
        let fileId:number;
        let tempFilePath:string;
        it('should save tempMessageFile',async () => {
            const readStream = fs.createReadStream(process.env.APP_HOME_PATH + '/test/files/test.txt')
            fileId = await saveTempMessageFile(
                0,
                mime.getType('txt'),
                'test.txt',
                readStream
            );
            const tempFileData:TempMessageFileData = await getTempMessageFileData(fileId)
            tempFilePath = tempFileData.serverFilePath + '/' + tempFileData.serverFileName
            expect(await doesFileExist(tempFilePath)).toEqual(true)
        })
        it('should save messageFile',async () => {
            await saveMessageFile(fileId,0,chatTypes.normalChat,0)
            const file:MessageFileData = await getMessageFileData(fileId)
            const filePath = file.serverFilePath + '/' + file.serverFileName
            expect(await doesFileExist(filePath)).toEqual(true)
            // tempFile should be removed
            expect(await doesFileExist(tempFilePath)).toEqual(false)
        })
    })
    describe('extension',() => {
        const fileName = 'test.tar.gz';
        it('get filename without extension',() => {
            expect(getFileNameWithoutExtension(fileName)).toEqual('test.tar')
        })
        it('get extension',() => {
            expect(getExtension(fileName)).toEqual('gz')
        })
    })
})