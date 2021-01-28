/*
    environment variables are loaded
 */
import dotEnv from 'dotenv';
dotEnv.config();
/*
    SSL-cert
 */
import fs from 'fs';

const key = fs.readFileSync(process.env.KEY_PATH);
const cert = fs.readFileSync(process.env.CERT_PATH);

import http from 'http';
import express_enforces_ssl from 'express-enforces-ssl';
import https from 'https';
import express from 'express';
import { Request, Response } from "express";
import helmet from 'helmet';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import compression from 'compression';
/*
    routers are imported
 */
import authRouter from './routes/auth';
import userRouter from './routes/user';
import groupRouter from './routes/group';
import chatRouter from './routes/chats';
import messageRouter from './routes/message';
import pwResetRouter from './routes/passwordReset';

import * as mysql from 'mysql2';
import {chatServer, createChatServer} from './chatServer';
/*
    express-server is initialized
 */
const httpPort = process.env.NODE_HTTP_PORT;
const httpsPort = process.env.NODE_HTTPS_PORT;

export let app:any;
export let con:any;
let httpServer:any;
let httpsServer:any;

export function startServer(){
    app = express();
    httpServer = http.createServer(app);
    httpsServer = https.createServer(
        {
            key: key,
            cert: cert
        },app);
    /*
        various middleware for express
     */
    app.use(helmet());
    if(process.env.NODE_ENV !== "test") {
        app.use(express_enforces_ssl());
    }
    app.use(express.static('build'));
    app.use(express.static(
        'public',
        {dotfiles:'allow'}
    ));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(express.static('public'));
    app.use(cors());
    app.use(cookieParser());
    app.use(compression());
    /*
        Routers for express
     */
    app.use('/auth',authRouter);
    app.use('/user',userRouter);
    app.use('/group',groupRouter);
    app.use('/chats',chatRouter);
    app.use('/message',messageRouter);
    app.use('/pwReset',pwResetRouter);

    con = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        charset : 'utf8mb4'
    });
    con.connect(function(err:any) {
        if (err) throw err;
    });
    /*
        chatServer is created
     */
    if(process.env.NODE_ENV !== "test") {
        createChatServer(httpsServer, con, app);
    }else{
        createChatServer(httpServer, con, app);
    }

    app.get('/', function (req: Request, res: Response) {
        res.sendFile('build/index.html',{ root: '.' });
    });
    app.get('*', function (req: Request, res: Response) {
        res.sendFile('build/index.html',{ root: '.' });
    });

    httpServer.listen(httpPort,function(){
        console.log('Express http server listening on port ' + httpPort);
    });
    httpsServer.listen(httpsPort,function () {
        console.log('Express https server listening on port ' + httpsPort);
    });

}
export function closeServer(){
    chatServer.io.close();
    httpServer.close();
    httpsServer.close();
    con.end();
}