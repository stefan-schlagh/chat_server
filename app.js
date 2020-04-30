const express = require('express');
const session = require('express-session');
const app = express();
const http = require('http').createServer(app);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
//const io = require('socket.io')(http);
const cors = require ('cors');
const authenthification = require('./modules/authenthification');
//const chatServer = new chat_server.chat_server(io);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
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

const mysql = require('mysql');
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

const chat_server = require('./modules/chat_server').createChatServer(http,con);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/html/index.html');
});

http.listen(3001,function () {
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