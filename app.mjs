import express from 'express';
import session from 'express-session';
const app = express();
import http from 'http';
const server = http.createServer(app);
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
//const io = require('socket.io')(http);
import cors from 'cors';
//const chatServer = new chat_server.chat_server(io);
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import {authenticationRequests} from "./modules/authentication/requests.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

import mysql from 'mysql';
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "chat",
    dateStrings: 'date'
});
con.connect(function(err) {
    if (err) throw err;
});

import createChatServer from "./modules/chatServer/chat_server.js";
const chat_server = createChatServer(http,con,app);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/html/index.html');
});

server.listen(3001,function () {
    console.log('Example app listening on port 3001!');
});

/*
    authenticationRequests get initialized
 */
authenticationRequests(app,con);