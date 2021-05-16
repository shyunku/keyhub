const path = require('path');
const rootDir = path.resolve(__dirname, '../../');

module.exports = {
    directory: {
        root: rootDir,
        userAccountDatabase: rootDir + '/datafiles/databases',
    },
    path: {
        coreDB: rootDir + '/datafiles/core/core.sqlite3',
        coreTemplateDB: rootDir + '/public/default/core-template.sqlite3',
        userTemplateDB: rootDir + '/public/default/user-template.sqlite3'
    }
};