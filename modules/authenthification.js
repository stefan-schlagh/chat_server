exports.login = function(username,password,con,chatServer,callback){
    //esistiert Username überhaupt?
    uNameTaken(username,con,function(exists,uid){
       if(exists){
           /*
                es wird überprüft, ob user schon bereits online ist,
            */
           if(chatServer !== undefined && !chatServer.isUserOnline(uid)){
               //Passwort hash wird aus db geholt
               con.query("SELECT password FROM user WHERE username = '" + username + "';", function (err, result, fields) {
                   const hash = JSON.parse(JSON.stringify(result))[0].password;
                   const bcrypt = require('bcrypt');
                   //Passwort wird überprüft
                   bcrypt.compare(password, hash, function (err, result) {
                       //Passwort passt
                       if (result) {
                           const msg = {
                               success: true
                           };
                           //success, msg
                           callback(true, msg, uid);
                       } else {
                           const msg = {
                               success: false,
                               password: "Wrong password!"
                           };
                           //success, msg
                           callback(false, msg);
                       }
                   });
               });
           }else{
               const msg = {
                   success: false,
                   username: "User is already logged in!"
               };
               //success, msg
               callback(false, msg);
           }
       }else{
           const msg = {
               success: false,
               username: "Username does not exist"
           };
           //success, msg
           callback(false, msg);
       }
    });

};
exports.register = function(username,password,con,callback){
    uNameTaken(username,con,function(exists){
        //username darf nich nicht vergeben sein
        let success = !exists;

        const bcrypt = require('bcrypt');
        const saltRounds = 10;

        if(success) {
            const msg = {
                success: true
            };
            //salt wird generiert
            bcrypt.genSalt(saltRounds, function (err, salt) {
                //hash wird generiert
                bcrypt.hash(password, salt, function (err, hash) {
                    //Daten werden in DB gespeichert
                    con.query(
                        "INSERT INTO user(username,password,time) VALUES ('" + username + "','" + hash + "',CURRENT_TIMESTAMP())",
                        function (err, result, fields) {
                            if (err) throw err;
                            uNameTaken(username,con,function(exists,uid){
                                //success, msg
                                callback(success,msg,uid);
                            });
                        });
                });
            });
        }else{
            const msg = {
                success: false,
                username: "Username already taken"
            };
            //success, msg
            callback(success, msg);
        }
    });
};
function uNameTaken(username,con,callback){
    con.query("SELECT uid FROM user WHERE Username = '"+username+"';",function(err,result,fields){
        if (err) throw err;
        if(JSON.parse(JSON.stringify(result)).length !== 0)
            callback(true,JSON.parse(JSON.stringify(result))[0].uid);
        else{
            callback(false);
        }
    });
}