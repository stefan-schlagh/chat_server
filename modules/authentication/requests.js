import {login,register} from "./authentication.js";
import {chatServer} from "../chatServer/chat_server.js";

export function authenticationRequests(app,con){

    app.post('/login', function (req, res) {
        let username = req.body.username;
        let password = req.body.password;

        login(username,password,con,chatServer)
            .then(result => {
                if(result.success){
                    //cookie is set
                    let sess = req.session;
                    sess.uid = result.uid;
                    sess.username = username;
                    sess.save(function(err) {
                        // session saved
                        if(err)
                            console.log(err);
                    })
                }
                res.send(result);
            })
            .catch(err => console.log(err));
    });

    app.post('/register', function (req, res) {
        let username = req.body.username;
        let password = req.body.password;

        register(username,password,con)
            .then(result => {
                if(result.success){
                    //cookie is set
                    const sess = req.session;
                    sess.uid = result.uid;
                    sess.username = username;
                    sess.save(function(err) {
                        // session saved
                        if(err)
                            console.log(err);
                    })
                }
                res.send(result);
            })
            .catch(err => console.log(err));
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

}