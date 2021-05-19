/* ---------------------------- Imports ---------------------------- */
const fs = require('fs');
const path = require('path');
const sha256 = require('sha256');
const {ipcMain, webContents, app, BrowserWindow, screen, remote, Menu} = require('electron');

const packageJson = require('../../package.json');
const pathManager = require('./path');
const sqlite = require('./sqlite');

const coreQueryLib = require('./core-query');
const userQueryLib = require('./user-query');

/* ---------------------------- Declaration (Variables) ---------------------------- */
const isBuildMode = !process.env.ELECTRON_START_URL;
let mainWindow = null;
let entryUrlPrefix = 'http://localhost:3000/';
let coreDB, userDB;
let coreQuery, userQuery;
const defaultWindowProperties = {
    width: 500,
    height: 500,
    webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        webviewTag: true,
        webSecurity: false,
        devTools: packageJson.debug || false,
        spellcheck: false,
        contextIsolation: false
    },
    resizable: false,
    frame: false,
    center: true,
    show: false
};

/* ---------------------------- Preprocess ---------------------------- */
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
ipcMain.on('createAccount', (e, data) => {
    const {name, encrypted_pw} = data;

    fetchUserInfo(userInfo => {
        if(userInfo.find(e => e.name === name)){
            e.reply('createAccount', {
                success: false,
                message: '이미 사용 중인 계정 이름입니다.'
            });
        }else{
            // TODO :: 계정 저장
            coreQuery.createUser(name, sha256(encrypted_pw), () => {
                fs.copyFileSync(
                    pathManager.path.userTemplateDB, 
                    pathManager.directory.userAccountDatabase + '/' + name + '.sqlite3'
                );

                setSubjectUserDB(name);

                e.reply('createAccount', {
                    success: true,
                });
            });
        }
    });
});
ipcMain.on('createFolder', (e, data) => {
    const {name, fid} = data;
    userQuery.createFolder(fid, name, res => {
        e.reply('createFolder', {
            success: res,
            message: res === false ? '폴더 생성에 실패했습니다.' : ''
        });
    });
});
ipcMain.on('createItem', (e, data) => {
    const {name, fid} = data;
    userQuery.createItem(fid, name, res => {
        e.reply('createItem', {
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
                setSubjectUserDB(userInfo.name);

                userQuery.createKeypair(iid, key, encrypted_value, res => {
                    e.reply('createKeypair', {
                        success: res,
                        message: res === false ? '항목 생성에 실패했습니다.' : ''
                    });
                });
            }else{
                e.reply('createKeypair', {
                    success: false,
                    message: '비밀번호가 틀렸습니다.'
                });
            }
        }else{
            e.reply('createKeypair', {
                success: false,
                message: '존재하지 않는 유저입니다.'
            });
        }
    });
});
ipcMain.on('getAllFoldersByFid', (e, data) => {
    const {cur_fid} = data;
    userQuery.getAllFoldersByFid(cur_fid, res => {
        e.reply('getAllFoldersByFid', res);
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

/* ---------------------------- Declaration (Functions) ---------------------------- */
function makeWindow(isModal, arg, callback = () => {}) {
    let url = decodeURIComponent(entryUrlPrefix + '#' + arg.url).replace(/\s/g, '');

    if(isBuildMode){
        url = modalUrl.replaceAll("\\", "/");
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
        minWidth: 300,
        minHeight: 500,
        frame: false,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            webviewTag: true,
            nodeIntegrationInSubFrames: true,
            webSecurity: false,
            spellcheck: false,
            contextIsolation: false
        }
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
        userInfoArr.reduce((acc, cur) => {
            if(cur.user_id){
                acc[cur.user_id] = cur;
            }
            return acc;
        }, {});

        resolve(userInfoArr);
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
                let modifiedTime = fs.statSync(filePath).mtime.getTime();
                return {
                    name: entry,
                    last_modified_time: modifiedTime
                }
            });

            let userMap = dbRes.reduce((acc, cur) => {
                // DB에는 있는데 데이터 파일 존재하지 않음으로 표시
                cur.db_exists = false;
                cur.last_modified_time = null;
                acc[cur.name] = cur;
                return acc;
            }, {});

            for(let fuserInfo of userInfoFromDatabases){
                let fName = fuserInfo.name;
                if(userMap.hasOwnProperty(fName)){
                    // DB에 있고 데이터 파일 존재 시
                    userMap[fName].db_exists = true;
                }else{
                    // DB에는 없는데 데이터 파일 존재 시
                    userMap[fName] = {
                        name: fName,
                        db_exists: false
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