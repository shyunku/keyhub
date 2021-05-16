import IpcRouter from 'components/routers/IpcRouter';
import React from 'react';
import {IoMdClose} from 'react-icons/io';

const electron = window.require("electron");
const {ipcRenderer} = electron;

class AskPopup extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            text_list: [],
            use_confirm: false,
            use_cancel: false,
            confirm_button_label: "확인",
            cancel_button_label: "취소",
            confirm_topic: null,
            cancel_topic: null,
            data: null,
            jsx: []
        }
    }

    componentDidMount(){
        ipcRenderer.on("__data_param__", (event, data) => {
            this.setState(data);
        });
    }

    confirmButtonClickHandler = () => {
        if(this.state.confirm_topic){
            IpcRouter.redirect(this.state.confirm_topic, this.state);
        }
        electron.remote.getCurrentWindow().close();
    }

    cancelButtonClickHandler = () => {
        if(this.state.cancel_topic){
            IpcRouter.redirect(this.state.cancel_topic, this.state);
        }
        electron.remote.getCurrentWindow().close();
    }

    inputChangeHandler = (e) =>{
        let name = e.target.name;
        this.setState({
            [name]: e.target.value
        });
    }

    inputKeyDownHandler = (e) => {
        if(e.keyCode === 13){
            this.confirmButtonClickHandler();
        }
    }

    closeWindow = () => {
        electron.remote.getCurrentWindow().close();
    }

    render() {
        return (
            <div className="popup">
                <div className="top-bar" onClick={this.closeWindow}>
                    <div className="close-btn">
                        <IoMdClose/>
                    </div>
                </div>
                {
                    this.state.text_list.length > 0 &&
                    <div className="text-wrapper">
                        {
                            this.state.text_list.map((item, key) => {
                                return(
                                    <div className="popup-message">{item}</div>
                                )
                            })
                        }
                    </div>
                }
                <div className="jsx-elements">
                    {
                        this.state.jsx.map((jsx, ind) => {
                            let jsx_name = jsx.name || `jsx-${jsx.type}-${ind}`;
                            switch(jsx.type){
                                case 'input':
                                    return (
                                        <input name={jsx_name} placeholder={jsx.placeholder || ''}
                                            onKeyDown={jsx.enter_to_confirm ? this.inputKeyDownHandler : null}
                                            onChange={this.inputChangeHandler} value={this.state[jsx_name]}/>
                                    );
                                default:
                                    return <>NO_TYPE_JSX</>
                            }
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

export default AskPopup;