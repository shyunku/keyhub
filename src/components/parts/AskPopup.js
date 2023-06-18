import IpcRouter from "components/routers/IpcRouter";
import React from "react";
import { IoMdClose } from "react-icons/io";

const electron = window.require("electron");
const sha256 = require("sha256");
const { ipcRenderer } = electron;
const remote = window.require("@electron/remote");

class AskPopup extends React.Component {
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
      jsx: [],
    };
  }

  componentDidMount() {
    ipcRenderer.on("__data_param__", (event, data) => {
      let wrap = {};
      for (let jsx of data.jsx) {
        switch (jsx.type) {
          case "input":
            wrap[jsx.name] = jsx.value || "";
            break;
          default:
            break;
        }
      }
      this.setState(Object.assign(data, wrap));
    });
  }

  confirmButtonClickHandler = () => {
    if (this.state.confirm_topic) {
      IpcRouter.redirect(this.state.confirm_topic, this.applyCrypto(this.state));
    }
    remote.getCurrentWindow().close();
  };

  cancelButtonClickHandler = () => {
    if (this.state.cancel_topic) {
      IpcRouter.redirect(this.state.cancel_topic, this.applyCrypto(this.state));
    }
    remote.getCurrentWindow().close();
  };

  buttonClickHandler = (callback_topic) => {
    if (callback_topic) {
      IpcRouter.redirect(callback_topic, this.applyCrypto(this.state));
    }
    remote.getCurrentWindow().close();
  };

  applyCrypto = (cur_state) => {
    let state = Object.assign({}, cur_state);
    const jsx = state.jsx;

    for (let e of jsx) {
      state[e.name] = this.loadCrypto(e.crypto)(state[e.name]);
    }

    return state;
  };

  loadCrypto = (label) => {
    switch (label) {
      case "sha256":
        return sha256;
      default:
        return (e) => e;
    }
  };

  inputChangeHandler = (e) => {
    let name = e.target.name;
    this.setState({
      [name]: e.target.value,
    });
  };

  inputKeyDownHandler = (e) => {
    if (e.keyCode === 13) {
      this.confirmButtonClickHandler();
    }
  };

  closeWindow = () => {
    remote.getCurrentWindow().close();
  };

  render() {
    return (
      <div className="popup ask">
        <div className="top-bar" onClick={this.closeWindow}>
          <div className="close-btn">
            <IoMdClose />
          </div>
        </div>
        {this.state.text_list.length > 0 && (
          <div className="text-wrapper">
            {this.state.text_list.map((item, key) => {
              return <div className="popup-message">{item}</div>;
            })}
          </div>
        )}
        <div className="jsx-elements">
          {this.state.jsx.map((jsx, ind) => {
            let jsx_name = jsx.name || `jsx-${jsx.type}-${ind}`;
            switch (jsx.type) {
              case "input":
                return (
                  <input
                    name={jsx_name}
                    placeholder={jsx.placeholder || ""}
                    type={jsx.hide ? "password" : "text"}
                    onKeyDown={jsx.enter_to_confirm ? this.inputKeyDownHandler : null}
                    onChange={this.inputChangeHandler}
                    value={this.state[jsx_name]}
                  />
                );
              case "button":
                return (
                  <button
                    name={jsx_name}
                    className={(jsx.class || []).join(" ")}
                    onClick={(e) => {
                      this.buttonClickHandler(jsx.callback_topic);
                    }}
                  >
                    {jsx.text}
                  </button>
                );
              default:
                return <>NO_TYPE_JSX</>;
            }
          })}
        </div>
        <div className="button-container">
          {this.state.use_confirm && (
            <button className="confirm" onClick={this.confirmButtonClickHandler}>
              {this.state.confirm_button_label}
            </button>
          )}
          {this.state.use_cancel && (
            <button className="cancel" onClick={this.cancelButtonClickHandler}>
              {this.state.cancel_button_label}
            </button>
          )}
        </div>
      </div>
    );
  }
}

export default AskPopup;
