import React, { Component } from 'react';
import {Switch, Route, HashRouter} from 'react-router-dom';
import Login from 'components/pages/Login';
import AlertPopup from 'components/parts/Popup';
import IpcRouter from 'components/routers/IpcRouter';

const electron = window.require("electron");
const {ipcRenderer} = electron;
export default class MainRouter extends Component{
    constructor(props){
        super(props);
    }

    componentDidMount(){
        ipcRenderer.on('error', (e, msg) => {
            let message = msg;
            console.log(typeof msg);
            if(typeof msg === 'object'){
                message = msg.toString();
            }

            IpcRouter.floatAlert({
                level: 2,
                text_list: [message],
                use_confirm: true
            });
        });
    }

    componentWillUnmount(){
        ipcRenderer.removeAllListeners();
    }

    render(){
        return(
            <HashRouter>
                <Switch>
                    <Route exact path="/" component={Login}/>
                    <Route path="/login" component={Login}/>
                    <Route path="/alert" component={AlertPopup}/>
                </Switch>
            </HashRouter>
        );
    }
};