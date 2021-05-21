const electron = window.require('electron');
const {ipcRenderer} = electron;

const noCallbackForIpcRendererError = () => {throw new Error('No callback found for ipcRenderer.')};

module.exports = {
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
    },
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
    floatAsk: function(popup_data, bound = {}, properties = {}){
        let texts = popup_data?.text_list.length || 0;
        let jsxs = (popup_data?.jsx || []).reduce((acc, cur) => {
            if(cur.type === 'input') acc += 40;
            else if(cur.type === 'button') acc += 35;
            else acc += 30;
            return acc;
        }, 0);
        let confirm_addition = popup_data.use_confirm === true ? 35 : 0;
        let cancel_addition = popup_data.use_cancel === true ? 35 : 0;
        let height = 110 + texts * 18 + jsxs + confirm_addition + cancel_addition;
        
        ipcRenderer.send('floatPopup', Object.assign(
            {
                preferredWindowProperties: Object.assign({
                    width: 300,
                    height: height,
                }, bound)
            },
            properties,
            {
                dataParam: popup_data
            }, 
            {
                url: '/ask'
            }
        ));
    },
};