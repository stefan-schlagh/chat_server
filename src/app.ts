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

import http, {Server} from 'http';
import express_enforces_ssl from 'express-enforces-ssl';
import https, {Server as sServer} from 'https';
import express, {Express, Request, Response} from 'express';
// @ts-ignore
import helmet from 'helmet';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import compression from 'compression';
// @ts-ignore
import winston, {format} from 'winston';
import expressWinston from 'express-winston';
import 'winston-daily-rotate-file';
/*
    routers are imported
 */
import authRouter from './routes/auth';
import userRouter from './routes/user';
import groupRouter from './routes/group';
import chatRouter from './routes/chats';
import messageRouter from './routes/message';
import pwResetRouter from './routes/passwordReset';
import pushRouter from './routes/push';

import {socketServer, createSocketServer} from './socketServer';
import {logger} from "./util/logger";
import {startPool,endPool} from "./database/pool";
/*
    express-server is initialized
 */
const httpPort = process.env.NODE_HTTP_PORT;
const httpsPort = process.env.NODE_HTTPS_PORT;

export let app:Express;
let httpServer:Server;
let httpsServer:sServer;

export function startServer(){
    app = express();
    httpServer = http.createServer(app);
    httpsServer = https.createServer(
        {
            key: key,
            cert: cert
        },app);
    app.use(expressWinston.logger({
        transports: [
            new winston.transports.DailyRotateFile({
                filename: 'log/http-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true
            })
        ],
        format: winston.format.combine(
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            winston.format.json()
        ),
        meta: true, // optional: control whether you want to log the meta data about the request (default to true)
        msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
        expressFormat: true,
        colorize: false,
    }));
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
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(express.static('public'));
    app.use(cors());
    app.use(cookieParser());
    app.use(compression());

    startPool();
    /*
        chatServer is created
     */
    if(process.env.NODE_ENV !== "test") {
        createSocketServer(httpsServer);
    }else{
        createSocketServer(httpServer);
    }

    /*
        Routers for express
     */
    app.use('/auth',bodyParser.json(),authRouter);
    app.use('/user',bodyParser.json(),userRouter);
    app.use('/group',bodyParser.json(),groupRouter);
    app.use('/chats',bodyParser.json(),chatRouter);
    app.use('/message',messageRouter);
    app.use('/pwReset',bodyParser.json(),pwResetRouter);
    app.use('/push',bodyParser.json(),pushRouter);

    app.get('/', function (req: Request, res: Response) {
        res.sendFile('build/index.html',{ root: '.' });
    });
    app.get(
        [
            '/chat*','/about*',
            '/login*','/register*',
            '/verifyEmail*','/forgotPassword*','/resetPassword*'
        ],
        function (req: Request, res: Response) {
        res.sendFile('build/index.html',{ root: '.' });
    });

    httpServer.listen(httpPort,function(){
        console.log('Express http server listening on port ' + httpPort);
    });
    httpsServer.listen(httpsPort,function () {
        console.log('Express https server listening on port ' + httpsPort);
    });

    logger.info('app created');

}
export function closeServer(){
    socketServer.io.close();
    httpServer.close();
    httpsServer.close();
    endPool();

    logger.info('chatServer closed');
}