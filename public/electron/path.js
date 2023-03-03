const { app } = require("electron");
const path = require("path");
const package = require("../../package.json");

const appDataPath = app.getPath("userData");
const appPath = app.getAppPath();
const isBuildMode = !process.env.ELECTRON_START_URL;
const datafilesDirname = "datafiles";

let schemeVersion = package.schemeVersion;
const rootDir = isBuildMode ? appDataPath : path.join(__dirname, "../../");

module.exports = {
  directory: {
    root: rootDir,
    core: path.join(rootDir, datafilesDirname, schemeVersion, "core"),
    userAccountDatabase: path.join(rootDir, datafilesDirname, schemeVersion, "databases"),
  },
  path: {
    coreDB: path.join(rootDir, datafilesDirname, schemeVersion, "core", "core.sqlite3"),
    coreTemplateDB: isBuildMode
      ? path.join(appPath, "../", "default", "core-template.sqlite3")
      : path.join(rootDir, "public", "default", "core-template.sqlite3"),
    userTemplateDB: isBuildMode
      ? path.join(appPath, "../", "default", "user-template.sqlite3")
      : path.join(rootDir, "public", "default", "user-template.sqlite3"),
  },
};
