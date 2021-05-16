const sqlite3 = require('sqlite3');
const path = require('./path');

function getDatabaseContext(path, resolve){
    const context = new sqlite3.Database(path, err => {
        if(err) throw err;
        else{
            resolve(context);
        }
    });
}

module.exports = {
    getCoreDatabaseContext: function(resolve){
        getDatabaseContext(path.path.coreDB, resolve);
    },
    getUserDatabaseContext: function(username, resolve){
        getDatabaseContext(
            path.directory.userAccountDatabase + '/' + username + '.sqlite3',
            resolve
        );
    }
}