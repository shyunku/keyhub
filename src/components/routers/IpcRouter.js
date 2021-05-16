const electron = window.require('electron');
const {ipcRenderer} = electron;

const noCallbackForIpcRendererError = () => {throw new Error('No callback found for ipcRenderer.')};

module.exports = {
    floatAlert: function(popup_data, properties = {}){
        ipcRenderer.send('floatPopup', Object.assign(
            {
                preferredWindowProperties: {
                    width: 250,
                    height: 200,
                }
            },
            properties,
            {
                dataParam: popup_data
            }, 
            {
                url: '/alert'
            }
        ));
    },
    redirect: function(topic, data){
        ipcRenderer.send('redirect', {topic: topic, data: data});
    },
    reflect: function(topic, data, callback = noCallbackForIpcRendererError){
        ipcRenderer.send(topic, data);
        ipcRenderer.on(topic, (e, data) => {
            callback(data);
        });
    },
    reflectOnce: function(topic, data, callback = noCallbackForIpcRendererError){
        ipcRenderer.send(topic, data);
        ipcRenderer.once(topic, (e, data) => {
            callback(data);
        });
    }
};