import React, {Component} from 'react';
import TopActionBar from 'components/parts/TopActionBar';
import IpcRouter from 'components/routers/IpcRouter';
import {HiOutlineArrowNarrowRight} from 'react-icons/hi';
import Util from 'assets/js/Util';

const electron = window.require("electron");
const {ipcRenderer} = electron;
const sha256 = require('sha256');

class Login extends Component{
    constructor(props){
        super(props);

        this.state = {
            item_selected: false,
            account_create_mode: false,
            name_input: '',
            pw_input: '',
            min_name_input_len: 3,
            min_pw_input_len: 6,
            fetched_user_list: []
        };

        this.callback_create_account_confirm = Util.generateUniqueTopic('cac');
    }

    componentDidMount(){
        IpcRouter.reflectOnce('getUserAccounts', null, data => {
            this.setState({
                fetched_user_list: data
            });
        });

        ipcRenderer.on('createAccount', (e, data) => {
            if(data.success){
                IpcRouter.floatAlert({
                    level: 0,
                    text_list: ['계정이 생성되었습니다.'],
                    use_confirm: true
                });
            }else{
                IpcRouter.floatAlert({
                    level: 1,
                    text_list: [data.message],
                    use_confirm: true
                });
            }
        });

        ipcRenderer.on(this.callback_create_account_confirm, (e, data) => {
            // TODO :: 홈으로 이동

        });
    }

    componentWillUnmount(){
        ipcRenderer.removeAllListeners();
    }

    render(){
        return(
            <div className="page">
                <TopActionBar/>
                <div id="login_page" className="page-content">
                    <div className="login-form">
                        <div className="saved-accounts">
                            <div className="label">로그인할 계정 선택</div>
                            <div className="account-list">
                                {
                                    this.state.fetched_user_list.map(user_info => {
                                        return(
                                            <div className="account" onClick={this.accountSelectHandler} key={user_info}>
                                                <div className="name">{user_info}</div>
                                                <div className="last-time">-일전</div>
                                            </div>
                                        );
                                    })
                                }
                                <div className="account" onClick={this.accountCreateHandler}>
                                    <div className="name">계정 추가</div>
                                </div>
                            </div>
                        </div>
                        <div className="lower-input" style={{display: this.state.item_selected ? 'flex' : 'none'}}>
                            <input id="name_input" className={this.state.account_create_mode ? '' : 'invisible'} 
                                value={this.state.name_input}
                                placeholder="계정 이름을 입력하세요" 
                                onChange={this.nameInputChangeHandler}/>
                            <input id="pw_input" type="password" placeholder="비밀번호를 입력하세요"
                                value={this.state.pw_input}
                                onChange={this.pwInputChangeHandler}
                                onKeyDown={this.onPasswordInputDoneHandler}/>
                            <div id="create_account_btn" className={this.state.account_create_mode ? '' : 'invisible'}
                                onClick={this.createAccount}>
                                <HiOutlineArrowNarrowRight/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    accountSelectHandler = () => {
        this.setState({
            item_selected: true,
            account_create_mode: false
        });
    }
    
    accountCreateHandler = () => {
        this.setState({
            item_selected: true,
            account_create_mode: true
        });
    }

    nameInputChangeHandler = (e) => {
        this.setState({
            name_input: e.target.value
        });
    }

    pwInputChangeHandler = (e) => {
        this.setState({
            pw_input: e.target.value
        });
    }

    createAccount = () => {
        if(this.state.account_create_mode){
            // 새로운 계정 생성
            let warn_text = this.validateInputs();
            
            if(warn_text){
                IpcRouter.floatAlert({
                    level: 1,
                    text_list: [warn_text],
                    use_confirm: true
                });
            }else{
                // 성공. 계정 정보 저장 후 로그인
                let nameInput = this.state.name_input;
                let pwInput = this.state.pw_input;

                ipcRenderer.send('createAccount', {
                    name: nameInput,
                    encrypted_pw: sha256(pwInput)
                });
            }
        }else{
            // TODO :: 기존 계정으로 로그인

        }
    }

    onPasswordInputDoneHandler = e => {
        if(e.keyCode === 13){
            this.createAccount();
        }
    }

    validateInputs = () => {
        let nameInput = this.state.name_input;
        let pwInput = this.state.pw_input;

        if(nameInput.length < this.state.min_name_input_len){
            return `계정 이름은 최소 ${this.state.min_name_input_len}자 이상이어야 합니다.`;
        }

        if(pwInput.length < this.state.min_pw_input_len){
            return `비밀번호는 최소 ${this.state.min_pw_input_len}자 이상이어야 합니다.`;
        }

        return null;
    }
}

export default Login;