module.exports = function(db){
    return {
        // Users
        getAllFoldersByFid: function(fid, resolve) {
            db.all(`SELECT * FROM folder_master where parent_fid IS ?;`, [fid], (err, result) => {
                if(err) throw err;
                resolve(result);
            });
        }
    };
}