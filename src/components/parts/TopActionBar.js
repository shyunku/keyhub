import React, {Component} from 'react';
import {IoMdClose} from 'react-icons/io';

const electron = window.require("electron");
class TopActionBar extends Component{
    constructor(props){
        super(props);
    }

    closeWindow = () => {
        electron.remote.getCurrentWindow().close();
    }

    render(){
        return(
            <div className="top-action-bar">
                <div className="title">KeyHub - 0.4v</div>
                <div className="close-btn clickable" onClick={this.closeWindow}>
                    <IoMdClose/>
                </div>
            </div>
        );
    }
}

export default TopActionBar;