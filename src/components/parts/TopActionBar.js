import React, {Component} from 'react';
import {IoMdClose} from 'react-icons/io';

class TopActionBar extends Component{
    constructor(props){
        super(props);
    }

    render(){
        return(
            <div className="top-action-bar">
                <div className="close-btn clickable">
                    <IoMdClose/>
                </div>
            </div>
        );
    }
}

export default TopActionBar;