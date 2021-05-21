module.exports = function(db){
    return {
        // Users
        getAllFoldersByFid: function(fid, resolve) {
            db.all(`
                SELECT *, (
                    SELECT sum(cnt)
                    FROM
                    (
                        SELECT count(*) as cnt
                        FROM folder_master
                        WHERE parent_fid = fm.fid
                            UNION ALL
                        SELECT count(*) as cnt
                        FROM item_master
                        WHERE fid = fm.fid
                    )
                ) AS count FROM folder_master as fm WHERE fm.parent_fid IS ?;
            `, [fid], (err, result) => {
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
        },
        deleteFolderOnly: function(fid, parent_fid, resolve){
            db.run(`UPDATE folder_master SET parent_fid = ? WHERE parent_fid IS ?;`, [parent_fid, fid], err => {
                if(err){
                    console.error(err);
                    resolve(-1);
                }else{
                    db.run(`UPDATE item_master SET fid = ? WHERE fid IS ?;`, [parent_fid, fid], err => {
                        if(err){
                            console.error(err);
                            resolve(-2);
                        }else{
                            db.run(`DELETE FROM folder_master WHERE fid = ?;`, [fid], err => {
                                if(err){
                                    console.error(err);
                                    resolve(-3);
                                }else{
                                    resolve(0);
                                }
                            });
                        }
                    });
                }
            });
        },
        deleteFolderAndItsContents: function(fid, resolve){
            db.run(`
                WITH RECURSIVE recursive_flush_folder(parent, cur, name)
                AS (
                    VALUES(null, ?, 'unknown')
                    UNION ALL
                    SELECT folder_master.parent_fid, folder_master.fid, folder_master.name
                    FROM folder_master, recursive_flush_folder
                    WHERE folder_master.parent_fid = recursive_flush_folder.cur
                ),
                collected_res as(
                    SELECT rff.cur AS fid
                    FROM recursive_flush_folder AS rff
                    LEFT JOIN item_master im on rff.cur = im.fid
                )
                DELETE FROM item_master
                WHERE item_master.fid IN collected_res;
            `, [fid], err => {
                if(err){
                    console.error(err);
                    resolve(-1);
                }else{
                    // WTF??
                    db.run(`
                        WITH RECURSIVE recursive_flush_folder(parent, cur, name)
                        AS (
                            VALUES(null, ?, 'unknown')
                            UNION ALL
                            SELECT folder_master.parent_fid, folder_master.fid, folder_master.name
                            FROM folder_master, recursive_flush_folder
                            WHERE folder_master.parent_fid = recursive_flush_folder.cur
                        ),
                        collected_res as(
                            SELECT rff.cur AS fid
                            FROM recursive_flush_folder AS rff
                            LEFT JOIN item_master im on rff.cur = im.fid
                        )
                        DELETE FROM folder_master
                        WHERE folder_master.fid IN collected_res;
                    `, [fid], err => {
                        if(err){
                            console.error(err);
                            resolve(-2);
                        }else{
                            resolve(0);
                        }
                    });
                }
            });
        },
        deleteItem: function(iid, resolve){
            db.run(`DELETE FROM item_master WHERE iid = ?;`, [iid], err => {
                if(err){
                    console.error(err);
                    resolve(false);
                }else{
                    resolve(true);
                }
            });
        },
        deleteKeypair: function(kpid, resolve){
            db.run(`DELETE FROM keypair_master WHERE kpid = ?;`, [kpid], err => {
                if(err){
                    console.error(err);
                    resolve(false);
                }else{
                    resolve(true);
                }
            });
        },
        editFolder: function(fid, name, resolve){
            db.run(`UPDATE folder_master SET name = ? WHERE fid = ?;`, [name, fid], (err) => {
                if(err){
                    console.error(err);
                    resolve(false);
                }else{
                    resolve(true);
                }
            });
        },
        editItem: function(iid, name, resolve){
            db.run(`UPDATE item_master SET name = ? WHERE iid = ?;`, [name, iid], (err) => {
                if(err){
                    console.error(err);
                    resolve(false);
                }else{
                    resolve(true);
                }
            });
        },
        editKeypair: function(kpid, key, value, resolve){
            db.run(`UPDATE keypair_master SET key = ?, encrypted_value = ? WHERE kpid = ?;`, [key, value, kpid], (err) => {
                if(err){
                    console.error(err);
                    resolve(false);
                }else{
                    resolve(true);
                }
            });
        },
        getRecursiveCountsItemOnly: function(fid, resolve){
            db.all(`
                WITH RECURSIVE recursive_item_cnt(parent, cur, name)
                AS (
                    VALUES(null, ?, 'unknown')
                    UNION ALL
                    SELECT folder_master.parent_fid, folder_master.fid, folder_master.name
                    FROM folder_master, recursive_item_cnt
                    WHERE folder_master.parent_fid = recursive_item_cnt.cur
                )
                SELECT count(*)
                FROM recursive_item_cnt AS rc
                LEFT JOIN item_master im on rc.cur = im.fid
                WHERE im.iid IS NOT NULL;
            `, [fid], (err, results) => {
                if(err) throw err;
                resolve(results[0]);
            });
        },
        searchEntriesWithKeyword: function(keyword, resolve){
            db.all(`
                SELECT *, (
                    SELECT sum(cnt)
                    FROM
                    (
                        SELECT count(*) as cnt
                        FROM folder_master
                        WHERE parent_fid = fm.fid
                            UNION ALL
                        SELECT count(*) as cnt
                        FROM item_master
                        WHERE fid = fm.fid
                    )
                ) AS count FROM folder_master as fm WHERE name LIKE '%${keyword}%';
            `, [], (err, folders) => {
                if(err) throw err;
                db.all(`SELECT * FROM item_master WHERE name LIKE '%${keyword}%';`, [], (err, items) => {
                    if(err) throw err;
                    
                    resolve({folders, items});
                });
            });
        }
    };
}