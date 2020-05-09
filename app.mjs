import express from 'express';
import session from 'express-session';
const app = express();
import http from 'http';
const server = http.createServer(app);
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
//const io = require('socket.io')(http);
import cors from 'cors';
import authenthification from './modules/authenthification.js';
//const chatServer = new chat_server.chat_server(io);
import { dirname } from 'path';
import { fileURLToPath } from 'url';

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

import createChatServer from "./modules/chat_server.mjs";
const chat_server = createChatServer(http,con,app);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/html/index.html');
});

server.listen(3001,function () {
    console.log('Example app listening on port 3001!');
});

app.post('/login', function (req, res) {
    let username = req.body.username;
    let password = req.body.password;

    authenthification.login(username,password,con,chat_server,function(success,msg,uid){
        res.send(msg);
        if(success){
            //cookie setzen
            let sess = req.session;
            sess.uid = uid;
            sess.username = username;
            sess.save(function(err) {
                // session saved
            })
        }
    });
});

app.post('/register', function (req, res) {
    let username = req.body.username;
    let password = req.body.password;

    authenthification.register(username,password,con,function (success,msg,uid) {
        res.send(msg);
        if(success){
            //cookie setzen
            const sess = req.session;
            sess.uid = uid;
            sess.username = username;
            sess.save(function(err) {
                // session saved
            })
        }
    });
});

app.post('/userInfo',function(req,res){
    const sess = req.session;
    const loggedIn = sess.uid !== undefined;
    res.send(
        {
            loggedIn: loggedIn,
            uid: sess.uid,
            username:sess.username
        }
    );
});

app.post('/logout',function(req,res){
    const sess = req.session;
    sess.uid = undefined;
    sess.username = undefined;
    res.send({
        success: true
    });
});