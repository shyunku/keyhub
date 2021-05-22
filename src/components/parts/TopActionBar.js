import React, {Component} from 'react';
import {IoMdClose} from 'react-icons/io';

const electron = window.require("electron");
const packageJson = require('components/../../package.json');

class TopActionBar extends Component{
    closeWindow = () => {
        electron.remote.getCurrentWindow().close();
    }

    render(){
        return(
            <div className="top-action-bar">
                <div className="title">KeyHub - {packageJson.version}v</div>
                <div className="close-btn clickable" onClick={this.closeWindow}>
                    <IoMdClose/>
                </div>
            </div>
        );
    }
}

export default TopActionBar;