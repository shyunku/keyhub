import IpcRouter from 'components/routers/IpcRouter';
import React from 'react';
import {IoWarningOutline, IoCheckmarkCircle} from 'react-icons/io5';
import {VscError} from 'react-icons/vsc';

const electron = window.require("electron");
const {ipcRenderer} = electron;

class AlertPopup extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            level: 0,
            text_list: [],
            use_confirm: false,
            use_cancel: false,
            confirm_button_label: "확인",
            cancel_button_label: "취소",
            confirm_topic: null,
            cancel_topic: null,
            data: null
        }
    }

    componentDidMount(){
        ipcRenderer.on("__data_param__", (event, data) => {
            this.setState(data);
        });
    }

    confirmButtonClickHandler = () => {
        if(this.state.confirm_topic){
            IpcRouter.redirect(this.state.confirm_topic, this.state.data);
        }
        electron.remote.getCurrentWindow().close();
    }

    cancelButtonClickHandler = () => {
        if(this.state.cancel_topic){
            IpcRouter.redirect(this.state.cancel_topic, this.state.data);
        }
        electron.remote.getCurrentWindow().close();
    }

    render() {
        return (
            <div className="popup">
                <div className={`popup-level-image-wrapper level-${this.state.level}`}>
                    {
                        {
                            0: <IoCheckmarkCircle/>,
                            1: <IoWarningOutline/>,
                            2: <VscError/>
                        }[this.state.level]
                    }
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
                        <button className="confirm" onClick={this.confirmButtonClickHandler}>
                            {this.state.confirm_button_label}
                        </button>
                    }
                    {
                        this.state.use_cancel
                        &&
                        <button className="cancel" onClick={this.cancelButtonClickHandler}>
                            {this.state.cancel_button_label}
                        </button>
                    }
                    {
                        !(this.state.use_confirm || this.state.use_cancel) &&
                        <button className="cancel" onClick={this.cancelButtonClickHandler}>
                            창닫기
                        </button>
                    }
                </div>
            </div>
        );
    }
}

export default AlertPopup;