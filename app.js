/*
    environment variables are loaded
 */
import dotEnv from 'dotenv';
dotEnv.config();

import express from 'express';
import session from 'express-session';
const app = express();
import http from 'http';
const server = http.createServer(app);
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
//const io = require('socket.io')(http);
import cors from 'cors';
/*
    dirname is initialized
 */
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
/*
    routers are imported
 */
import authRouter from './modules/routes/auth.js';
import userRouter from './modules/routes/user.js';
import groupRouter from './modules/routes/group.js';
/*
    various middleware for express
 */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(cors());
app.use(cookieParser());
const MemoryStore =session.MemoryStore;
app.use(session({
    name : 'app.sid',
    secret: "1234567890QWERTY",
    resave: true,
    store: new MemoryStore(),
    saveUninitialized: true
}));
/*
    Routers for express
 */
app.use('/auth',authRouter);
app.use('/user',userRouter);
app.use('/group',groupRouter);
/*
    mysql connection is established
 */
import mysql from 'mysql';
const con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: '',
    database: process.env.DB_DATABASE,
    dateStrings: 'date',
    charset : 'utf8mb4'
});
con.connect(function(err) {
    if (err) throw err;
});
/*
    chatServer is created
 */
import {createChatServer} from './modules/chatServer.js';
createChatServer(http,con,app);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/html/index.html');
});

app.get('/IP',function(req,res){
   res.send(process.env.NODE_SERVER_IP);
});
/*
    express-server is initialized
 */
server.listen(3001,function () {
    console.log('Example app listening on port 3001!');
});