module.exports = function(db){
    return {
        // Users
        getUserInfo: function(resolve) {
            db.all(`SELECT * FROM users;`, [], (err, result) => {
                if(err) throw err;
                resolve(result);
            });
        }
    };
}