const path = require('path');
const rootDir = path.resolve(__dirname, '../../');

module.exports = {
    directory: {
        root: rootDir,
        userAccountDatabase: rootDir + '/datafiles/databases',
    }
};