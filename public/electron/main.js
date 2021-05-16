/* ---------------------------- Imports ---------------------------- */
const fs = require('fs');
const path = require('path');
const {ipcMain, webContents, app, BrowserWindow, screen, remote, Menu} = require('electron');

const packageJson = require('../../package.json');
const pathManager = require('./path');
const sqlite = require('./sqlite');

/* ---------------------------- Declaration (Variables) ---------------------------- */
const isBuildMode = !process.env.ELECTRON_START_URL;
let mainWindow = null;
let entryUrlPrefix = 'http://localhost:3000/';
let coreDB, userDB;
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
    const targetDir = pathManager.directory.userAccountDatabase;
    fetchUserDatabaseNames(users => {
        e.reply('getUserAccounts', users);
    });
});

ipcMain.on('createAccount', (e, data) => {
    const {name, encrypted_pw} = data;
    const targetDir = pathManager.directory.userAccountDatabase;

    fetchUserDatabaseNames(users => {
        e.reply('getUserAccounts', users);

        if(users.includes(name)){
            e.reply('createAccount', {
                success: false,
                message: '이미 사용 중인 계정 이름입니다.'
            });
        }else{
            // TODO :: 계정 저장
            fs.copyFileSync(
                pathManager.path.userTemplateDB, 
                pathManager.directory.userAccountDatabase + '/' + name + '.sqlite3'
            );

            e.reply('createAccount', {
                success: true,
            });
        }
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

function fetchUserDatabaseNames(resolve){
    fs.promises.readdir(targetDir).then(res => {
        let filteredDatabaseList = res.filter(entry => entry.search(/(.+).sqlite3$/g) !== -1);
        let filteredUser = filteredDatabaseList.map(entry => {
            let testRegex = /(.+).sqlite3$/g;
            let matchedResult = testRegex.exec(entry);
            return matchedResult ? matchedResult[1] : '';
        });
        resolve(filteredUser);
    }).catch(err => {
        throw err;
    });
}

// Ipc Message Broadcast
ipcMain.broadcast = function(topic, data) {
    for(let window of BrowserWindow.getAllWindows()){
        window.webContents.send(topic, data);
    }
}