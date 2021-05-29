/* ---------------------------- Imports ---------------------------- */
const fs = require('fs');
const path = require('path');
const url = require('url');
const sha256 = require('sha256');
const {ipcMain, webContents, app, BrowserWindow, screen, remote, Menu} = require('electron');

const packageJson = require('../../package.json');
const pathManager = require('./path');
const sqlite = require('./sqlite');
const fileManager = require('./file-manage');

const coreQueryLib = require('./core-query');
const userQueryLib = require('./user-query');

/* ---------------------------- Declaration (Variables) ---------------------------- */
let mainWindow = null;
const isBuildMode = !process.env.ELECTRON_START_URL;
let entryUrlPrefix = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, "../../build/index.html"),
    protocol: 'file',
    slashes: true,
});
let coreDB, userDB;
let coreQuery, userQuery;
const defaultWebPreferences = {
    nodeIntegration: true,
    enableRemoteModule: true,
    webviewTag: true,
    nodeIntegrationInSubFrames: true,
    webSecurity: true,
    spellcheck: false,
    contextIsolation: false
};
const defaultWindowProperties = {
    width: 500,
    height: 500,
    webPreferences: defaultWebPreferences,
    resizable: false,
    frame: false,
    center: true,
    show: false
};

/* ---------------------------- Preprocess ---------------------------- */
fileManager();
sqlite.getCoreDatabaseContext(context => {
    coreDB = context;
    coreQuery = coreQueryLib(coreDB);
});
console.log("Electron connected to ", entryUrlPrefix);

app.on('ready', createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

/* ---------------------------- IpcMain ---------------------------- */
ipcMain.on('floatPopup', (e, data) => {
    makeWindow(true, data);
});
ipcMain.on('redirect', async (e, _data) => {
    const {topic, data} = _data;
    ipcMain.broadcast(topic, data);
});
ipcMain.on('getUserAccounts', async (e, data) => {
    fetchUserInfo(userInfo => {
        e.reply('getUserAccounts', userInfo);
    });
});
ipcMain.on('authenticate', (e, data) => {
    const {user_id, encrypted_pw} = data;
    fetchUserMap(userMap => {
        if(userMap.hasOwnProperty(user_id)){
            let userInfo = userMap[user_id];
            let answer = userInfo.encrypted_pw;
            let submit = sha256(encrypted_pw);

            if(answer === submit){
                setSubjectUserDB(userInfo.name);
                e.reply('authenticate', {
                    success: true,
                });
            }else{
                e.reply('authenticate', {
                    success: false,
                    message: '비밀번호가 틀렸습니다.'
                });
            }
        }else{
            e.reply('authenticate', {
                success: false,
                message: '존재하지 않는 유저입니다.'
            });
        }
    });
});
/* ---------------- Create ---------------- */
ipcMain.on('createAccount', (e, data) => {
    const {name, encrypted_pw} = data;

    fetchUserInfo(userInfo => {
        if(userInfo.find(e => e.name === name)){
            e.reply('createAccount', {
                success: false,
                message: '이미 사용 중인 계정 이름입니다.'
            });
        }else{
            coreQuery.createUser(name, sha256(encrypted_pw), (lastId) => {
                fs.copyFileSync(
                    pathManager.path.userTemplateDB, 
                    pathManager.directory.userAccountDatabase + '/' + name + '.sqlite3'
                );

                setSubjectUserDB(name);

                e.reply('createAccount', {
                    success: true,
                    uid: lastId
                });
            });
        }
    });
});
ipcMain.on('createFolder', (e, data) => {
    const {name, fid} = data;
    userQuery.createFolder(fid, name, res => {
        e.reply('syncDatabase', {
            success: res,
            message: res === false ? '폴더 생성에 실패했습니다.' : ''
        });
    });
});
ipcMain.on('createItem', (e, data) => {
    const {name, fid} = data;
    userQuery.createItem(fid, name, res => {
        e.reply('syncDatabase', {
            success: res,
            message: res === false ? '항목 생성에 실패했습니다.' : ''
        });
    });
});
ipcMain.on('createKeypair', (e, data) => {
    const {key, encrypted_value, iid, encrypted_root_pw, user_id} = data;

    fetchUserMap(userMap => {
        if(userMap.hasOwnProperty(user_id)){
            let userInfo = userMap[user_id];
            let answer = userInfo.encrypted_pw;
            let submit = sha256(encrypted_root_pw);

            if(answer === submit){
                userQuery.createKeypair(iid, key, encrypted_value, res => {
                    e.reply('syncKeypairs', {
                        success: res,
                        message: res === false ? '항목 생성에 실패했습니다.' : ''
                    });
                });
            }else{
                e.reply('syncKeypairs', {
                    success: false,
                    message: '비밀번호가 틀렸습니다.'
                });
            }
        }else{
            e.reply('syncKeypairs', {
                success: false,
                message: '존재하지 않는 유저입니다.'
            });
        }
    });
});
/* ---------------- Delete ---------------- */
ipcMain.on('deleteFolderOnly', (e, data) => {
    const {fid, parent_fid} = data;
    userQuery.deleteFolderOnly(fid, parent_fid, res => {
        e.reply('syncDatabase', {
            success: res === 0,
            message: {
                "0": '',
                "-1": '오류가 발생해 폴더 삭제에 실패했습니다.',
                "-2": '오류가 발생해 하위 폴더들만 이전되었습니다.',
                "-3": '오류가 발생해 하위 폴더 및 항목들만 이전되었습니다.'
            }[res]
        });
    });
});
ipcMain.on('deleteFolderAll', (e, data) => {
    const {fid} = data;
    userQuery.deleteFolderAndItsContents(fid, res => {
        e.reply('syncDatabase', {
            success: res === 0,
            message: {
                "0": '',
                "-1": '오류가 발생해 폴더 삭제에 실패했습니다.',
                "-2": '오류가 발생해 하위 항목들만 삭제되었습니다.',
            }[res]
        });
    });
});
ipcMain.on('deleteItem', (e, data) => {
    const {iid} = data;
    userQuery.deleteItem(iid, res => {
        e.reply('syncDatabase', {
            success: res,
            message: res === false ? '항목 삭제에 실패했습니다.' : ''
        });
    });
});
ipcMain.on('deleteKeypair', (e, data) => {
    const {kpid, user_id, encrypted_root_pw} = data;
    fetchUserMap(userMap => {
        if(userMap.hasOwnProperty(user_id)){
            let userInfo = userMap[user_id];
            let answer = userInfo.encrypted_pw;
            let submit = sha256(encrypted_root_pw);

            if(answer === submit){
                userQuery.deleteKeypair(kpid, res => {
                    e.reply('syncKeypairs', {
                        success: res,
                        message: res === false ? '키페어 삭제에 실패했습니다.' : ''
                    });
                });
            }else{
                e.reply('syncKeypairs', {
                    success: false,
                    message: '비밀번호가 틀렸습니다.'
                });
            }
        }else{
            e.reply('syncKeypairs', {
                success: false,
                message: '존재하지 않는 유저입니다.'
            });
        }
    });

});
/* ---------------- Edit ---------------- */
ipcMain.on('editFolder', (e, data) => {
    const {fid, name} = data;
    userQuery.editFolder(fid, name, res => {
        e.reply('syncDatabase', {
            success: res,
            message: res === false ? '폴더 이름 수정에 실패했습니다.' : ''
        });
    });
});
ipcMain.on('editItem', (e, data) => {
    const {iid, name} = data;
    userQuery.editItem(iid, name, res => {
        e.reply('syncDatabase', {
            success: res,
            message: res === false ? '항목 이름 수정에 실패했습니다.' : ''
        });
    });
});
ipcMain.on('editKeypair', (e, data) => {
    const {new_key, encrypted_value, encrypted_root_pw, kpid, user_id} = data;
    fetchUserMap(userMap => {
        if(userMap.hasOwnProperty(user_id)){
            let userInfo = userMap[user_id];
            let answer = userInfo.encrypted_pw;
            let submit = sha256(encrypted_root_pw);

            if(answer === submit){
                userQuery.editKeypair(kpid, new_key, encrypted_value, res => {
                    e.reply('syncKeypairs', {
                        success: res,
                        message: res === false ? '키페어 수정에 실패했습니다.' : ''
                    });
                });
            }else{
                e.reply('syncKeypairs', {
                    success: false,
                    message: '비밀번호가 틀렸습니다.'
                });
            }
        }else{
            e.reply('syncKeypairs', {
                success: false,
                message: '존재하지 않는 유저입니다.'
            });
        }
    });
});
/* ---------------- Getter ---------------- */
ipcMain.on('getAllFoldersByFid', (e, data) => {
    const {cur_fid} = data;
    userQuery.getAllFoldersByFid(cur_fid, res => {
        e.reply('getAllFoldersByFid', res);
        ipcMain.broadcast('getAllFoldersByFid', res);
    });
});
ipcMain.on('getAllItemsByFid', (e, data) => {
    const {cur_fid} = data;
    userQuery.getAllItemsByFid(cur_fid, res => {
        e.reply('getAllItemsByFid', res);
    });
});
ipcMain.on('getAllKeypairsByIid', (e, data) => {
    const {iid} = data;
    userQuery.getAllKeypairsByIid(iid, res => {
        e.reply('getAllKeypairsByIid', res);
    });
});

ipcMain.on('searchEntriesWithKeyword', (e, data) => {
    const {keyword} = data;
    userQuery.searchEntriesWithKeyword(keyword, res => {
        e.reply('searchedEntries', res);
    });
});

/* ---------------------------- Declaration (Functions) ---------------------------- */
function makeWindow(isModal, arg, callback = () => {}) {
    let url = decodeURIComponent(entryUrlPrefix + '#' + arg.url).replace(/\s/g, '');

    if(isBuildMode){
        url = url.replaceAll("\\", "/");
    }

    let parentWindowId = arg.currentWindowId ? arg.currentWindowId : mainWindow.id;
    let parentWindow = BrowserWindow.fromId(parentWindowId);
    let parentWindowScreen = getWrappingScreen(parentWindow.getBounds());
    let parentWindowScreenBound = parentWindowScreen.bounds;
    let dataParam = arg.dataParam;

    let modalWindowProperty = Object.assign(
        {}, defaultWindowProperties, arg.preferredWindowProperties, {parent: parentWindow},
        {
            modal: isModal
        }
    );

    let newWindow = new BrowserWindow(modalWindowProperty);
    let childBound = newWindow.getBounds();

    if (isModal) {
        let parentPos = parentWindow.getPosition();
        let parentSize = parentWindow.getSize();

        let childPos = newWindow.getPosition();
        let childSize = newWindow.getSize();

        let nextChildPos = {
            x: parseInt(parentPos[0] + parentSize[0] / 2 - childSize[0] / 2),
            y: parseInt(parentPos[1] + parentSize[1] / 2 - childSize[1] / 2)
        }

        newWindow.setPosition(nextChildPos.x, nextChildPos.y, true);
    }
    else{
        let parentWindowBound = parentWindow.getBounds();

        newWindow.setPosition(parentWindowBound.x, parentWindowBound.y);
        newWindow.center();

        childBound = newWindow.getBounds();

        let allWindows = BrowserWindow.getAllWindows();
        let offset = 20;
        let pushed = 0;
        let preventErrorStack = 0;

        while(true){
            let breaking = false;
            preventErrorStack++;

            for(let window of allWindows){
                if(newWindow.id === window.id) continue;

                let windowBound = window.getBounds();
                let targetBound = {
                    x: childBound.x + offset * pushed,
                    y: childBound.y + offset * pushed,
                    width: childBound.width,
                    height: childBound.height
                };

                if(util.compareTolerateBound(targetBound, windowBound)){
                    pushed++;
                    breaking = true;
                    break;
                }
            }

            if(preventErrorStack > 300){
                break;
            }

            if(!breaking){
                newWindow.setPosition(childBound.x + offset * pushed, childBound.y + offset * pushed);
                break;
            }
        }
    }

    newWindow.loadURL(url);

    newWindow.on("ready-to-show", () => {
        newWindow.show();
        newWindow.blur();
        newWindow.focus();
        newWindow.webContents.send("__data_param__", dataParam);
        callback(newWindow);
    });

    newWindow.on('close', () => {
        if(parentWindow){
            parentWindow.focus();
        }
    });
}

function createWindow(){
    let getInstanceLock = app.requestSingleInstanceLock();

    if(!getInstanceLock){
        app.quit();
    }else{
        app.on("second-instance", (event, commandLine, workingDirectory) => {
            if(mainWindow){
                if(mainWindow.isMinimized()){
                    mainWindow.restore();
                }
                mainWindow.focus();
            }

            console.log("You can't multi execute this program!");
        });
    }

    mainWindow = new BrowserWindow({
        minWidth: 420,
        minHeight: 300,
        frame: false,
        show: false,
        webPreferences: defaultWebPreferences
    });

    mainWindow.loadURL(entryUrlPrefix);
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.hide();
        mainWindow.show();
    });
}

function getWrappingScreen(winBound){
    let displayList = screen.getAllDisplays();
    let centerPos = {x: winBound.x + winBound.width/2, y: winBound.y + winBound.height/2};

    for(let display of displayList){
        let dbound = display.bounds;

        if(
            centerPos.x >= dbound.x &&
            centerPos.x < (dbound.x + dbound.width) &&
            centerPos.y >= dbound.y &&
            centerPos.y < (dbound.y + dbound.height)
        ){
            return display;
        }
    }

    return displayList[0];
}

function setSubjectUserDB(name){
    sqlite.getUserDatabaseContext(name, context => {
        userDB = context;
        userQuery = userQueryLib(userDB);
    });
}

function fetchUserMap(resolve){
    fetchUserInfo(userInfoArr => {
        let userMap = userInfoArr.reduce((acc, cur) => {
            if(cur.user_id){
                acc[cur.user_id] = cur;
            }
            return acc;
        }, {});

        resolve(userMap);
    });
}

function fetchUserInfo(resolve){
    const targetDir = pathManager.directory.userAccountDatabase;
    coreQuery.getUserInfo(dbRes => {
        fs.promises.readdir(targetDir).then(res => {
            let filteredDatabaseList = res.filter(entry => entry.search(/(.+).sqlite3$/g) !== -1);
            let filteredUser = filteredDatabaseList.map(entry => {
                let testRegex = /(.+).sqlite3$/g;
                let matchedResult = testRegex.exec(entry);
                return matchedResult ? matchedResult[1] : '';
            });
            let userInfoFromDatabases = filteredUser.map(entry => {
                let filePath = targetDir + '/' + entry + '.sqlite3';
                let modifiedTime = fs.statSync(filePath).atime.getTime();
                return {
                    name: entry,
                    last_modified_time: modifiedTime
                }
            });

            let userMap = dbRes.reduce((acc, cur) => {
                // 유저 정보는 있는 것으로 확인된 것들
                cur.db_exists = false;
                cur.user_valid = true;
                cur.last_modified_time = null;
                acc[cur.name] = cur;
                return acc;
            }, {});

            for(let fuserInfo of userInfoFromDatabases){
                let fName = fuserInfo.name;
                if(userMap.hasOwnProperty(fName)){
                    // DB가 있는 것들
                    userMap[fName].db_exists = true;
                }else{
                    // DB가 있지만 유저 정보가 없는 것들
                    userMap[fName] = {
                        name: fName,
                        db_exists: true,
                        user_valid: false,
                    };
                }
                userMap[fName].last_modified_time = fuserInfo.last_modified_time;
            }

            let userInfoArr = Object.values(userMap);
            resolve(userInfoArr);
        }).catch(err => {
            throw err;
        });
    });
}

// Ipc Message Broadcast
ipcMain.broadcast = function(topic, data) {
    for(let window of BrowserWindow.getAllWindows()){
        window.webContents.send(topic, data);
    }
}

// setInterval(() => {
//     if(mainWindow){
//         let angle = new Date().getTime() / 800;
//         mainWindow.setPosition(parseInt(800 + 200 * Math.cos(angle)), parseInt(500 + 200 * Math.sin(angle)));
//     }
// });