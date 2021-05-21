const fs = require('fs');
const {app} = require('electron');
const pathManager = require('./path');
const package = require('../../package.json');

const appDataPath = app.getPath('userData');
const appPath = app.getAppPath();
const isBuildMode = !process.env.ELECTRON_START_URL;
const datafilesDirname = 'datafiles';

module.exports = function() {
    console.log("target: " + pathManager.directory.root);

    if(!fs.existsSync(pathManager.directory.core)){
        fs.mkdirSync(pathManager.directory.core, {recursive: true});
        console.log("Created core DB dir...");
    }

    if(!fs.existsSync(pathManager.directory.userAccountDatabase)){
        fs.mkdirSync(pathManager.directory.userAccountDatabase, {recursive: true});
        console.log("Created user DB dir...");
    }

    if(!fs.existsSync(pathManager.path.coreDB)){
        fs.copyFileSync(pathManager.path.coreTemplateDB, pathManager.path.coreDB);
        console.log("Created core DB...");
    }
};