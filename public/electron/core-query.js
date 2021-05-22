module.exports = function(db){
    return {
        // Users
        getUserInfo: function(resolve) {
            db.all(`SELECT * FROM user_master;`, [], (err, result) => {
                if(err) throw err;
                resolve(result);
            });
        },
        createUser: function(name, encrypted_pw, resolve) {
            db.run(
                `INSERT INTO user_master(name, encrypted_pw) VALUES(?, ?);`, 
                [name, encrypted_pw], function(err) {
                if(err) throw err;
                resolve(this.lastID);
            });
        }
    };
}