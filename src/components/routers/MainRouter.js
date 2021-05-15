import React from 'react';
import {Switch, Route, HashRouter} from 'react-router-dom';
import Login from 'components/pages/Login';
import AlertPopup from 'components/parts/Popup';

export default function MainRouter(){
    return(
        <HashRouter>
            <Switch>
                <Route path="/" component={Login}/>
                <Route path="/alert" component={AlertPopup}/>
            </Switch>
        </HashRouter>
    );
};