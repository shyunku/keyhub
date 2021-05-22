import React, { useEffect } from 'react';
import {Switch, Route, useLocation, HashRouter} from 'react-router-dom';

import Login from 'components/pages/Login';
import AlertPopup from 'components/parts/AlertPopup';
import AskPopup from 'components/parts/AskPopup';
import IpcRouter from 'components/routers/IpcRouter';
import Home from 'components/pages/Home';

const electron = window.require("electron");
const {ipcRenderer} = electron;

export default function MainRouter(props) {
    useEffect(() => {
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
    });

    return(
        <HashRouter>
            <Switch>
                <Route exact path="/" component={Login}/>
                <Route path="/login" component={Login}/>
                <Route path="/home" component={Home}/>
                <Route path="/alert" component={AlertPopup}/>
                <Route path="/ask" component={AskPopup}/>
            </Switch>
        </HashRouter>
    );
};