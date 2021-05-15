const electron = window.require('electron');
const {ipcRenderer} = electron;

module.exports = {
    floatAlert: function(popup_data){
        ipcRenderer.send('floatPopup', Object.assign(popup_data, {url: '/alert'}));
    },
    redirect: function(topic, data){
        ipcRenderer.send(topic, data);
    }
};