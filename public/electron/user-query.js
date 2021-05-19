module.exports = function(db){
    return {
        // Users
        getAllFoldersByFid: function(fid, resolve) {
            db.all(`SELECT * FROM folder_master where parent_fid IS ?;`, [fid], (err, result) => {
                if(err) throw err;
                resolve(result);
            });
        },
        getAllItemsByFid: function(fid, resolve) {
            db.all(`SELECT * FROM item_master where fid IS ?;`, [fid], (err, result) => {
                if(err) throw err;
                resolve(result);
            });
        },
        getAllKeypairsByIid: function(iid, resolve) {
            db.all(`SELECT * FROM keypair_master where iid IS ?;`, [iid], (err, result) => {
                if(err) throw err;
                resolve(result);
            });
        },
        createFolder: function(fid, name, resolve){
            db.run(`INSERT INTO folder_master(parent_fid, name) VALUES(?, ?);`, [fid, name], err => {
                if(err){
                    console.error(err);
                    resolve(false);
                }else{
                    resolve(true);
                }
            });
        },
        createItem: function(fid, name, resolve){
            db.run(`INSERT INTO item_master(fid, name, created_timestamp) VALUES(?, ?, ?);`, [fid, name, new Date().getTime()], err => {
                if(err){
                    console.error(err);
                    resolve(false);
                }else{
                    resolve(true);
                }
            });
        },
        createKeypair: function(iid, key, value, resolve){
            db.run(`INSERT INTO keypair_master(iid, key, encrypted_value) VALUES(?, ?, ?);`, [iid, key, value], err => {
                if(err){
                    console.error(err);
                    resolve(false);
                }else{
                    resolve(true);
                }
            });
        }
    };
}