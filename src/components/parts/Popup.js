import React from 'react';
import {IoWarningOutline, IoCheckmarkCircle} from 'react-icons/io5';

const ipcRouter = require('components/parts/Popup');
const electron = window.require("electron");
const {ipcRenderer} = electron;

class AlertPopup extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            is_warning: false,
            text_list: [],
            use_confirm: false,
            use_cancel: false,
            confirm_button_label: "확인",
            cancel_button_label: "취소",
            confirm_origin_topic: null,
            cancel_origin_topic: null,
            data: null
        }
    }

    componentDidMount(){
        ipcRenderer.on("__data_param__", (event, data) => {
            console.log(data);
            this.setState(data);
        });
    }

    confirmButtonClickHandler = () => {
        if(this.state.confirm_origin_topic){
            ipcRouter.redirect(this.state.confirm_origin_topic, this.state.data);
        }
        electron.remote.getCurrentWindow().close();
    }

    cancelButtonClickHandler = () => {
        if(this.state.cancel_origin_topic){
            ipcRouter.redirect(this.state.cancel_origin_topic, this.state.data);
        }
        electron.remote.getCurrentWindow().close();
    }

    render() {
        return (
            <div className="alert-popup">
                <div className="popup-level-image-wrapper">
                    {this.state.is_warning ? <IoWarningOutline/> : <IoCheckmarkCircle/>}
                </div>
                <div className="text-wrapper">
                    {
                        this.state.text_list.map((item, key) => {
                            return(
                                <div className="popup-message">{item}</div>
                            )
                        })
                    }
                </div>
                <div className="button-container">
                    {
                        this.state.use_confirm
                        &&
                        <button className="standard-button confirm-style-button" onClick={this.confirmButtonClickHandler}>
                            {this.state.confirm_button_label}
                        </button>
                    }
                    {
                        this.state.use_cancel
                        &&
                        <button className="standard-button cancel-style-button" onClick={this.cancelButtonClickHandler}>
                            {this.state.cancel_button_label}
                        </button>
                    }
                    {
                        !(this.state.use_confirm || this.state.use_cancel) &&
                        <button className="standard-button cancel-style-button" onClick={this.cancelButtonClickHandler}>
                            창닫기
                        </button>
                    }
                </div>
            </div>
        );
    }
}

export default AlertPopup;