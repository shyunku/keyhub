import React, {Component, createRef} from 'react';
import TopActionBar from 'components/parts/TopActionBar';
import IpcRouter from 'components/routers/IpcRouter';
import {HiOutlineArrowNarrowRight} from 'react-icons/hi';
import {RiErrorWarningLine} from 'react-icons/ri';
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
            selected_account_id: null,
            name_input: '',
            pw_input: '',
            min_name_input_len: 3,
            min_pw_input_len: 6,
            fetched_user_list: [],
            encrypted_pw: ''
        };

        this.callback_create_account_confirm = Util.generateUniqueTopic('cac');

        this.name_input_ref = createRef();
        this.pw_input_ref = createRef();
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
                    use_confirm: true,
                    confirm_topic: this.callback_create_account_confirm
                });
            }else{
                IpcRouter.floatAlert({
                    level: 1,
                    text_list: [data.message],
                    use_confirm: true
                });
            }
        });

        ipcRenderer.on('authenticate', (e, data) => {
            if(data.success){
                this.goHome();
            }else{
                IpcRouter.floatAlert({
                    level: 1,
                    text_list: [data.message],
                    use_confirm: true
                });
            }
        });

        ipcRenderer.on(this.callback_create_account_confirm, (e, data) => {
            this.goHome();
        });

        this.updateThread = setInterval(() => {
            this.forceUpdate();
        }, 1000);
    }

    goHome(){
        let encrypted_pw = this.state.encrypted_pw;
        let generated_key = Util.generateUniqueTopic('root-key');
        let double_encrypted_root_pw = encodeURIComponent(Util.aes.encrypt(encrypted_pw, generated_key));
        this.props.history.push(`/home?uid=${this.state.selected_account_id}&derp=${double_encrypted_root_pw}&rpk=${generated_key}`);
    }

    componentWillUnmount(){
        ipcRenderer.removeAllListeners();
        clearInterval(this.updateThread);
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
                                            <div className={"account " + (this.state.selected_account_id === user_info.user_id ? 'selected' : '')}
                                                onClick={user_info.db_exists ? e => this.accountSelectHandler(user_info.user_id) : null} 
                                                key={user_info.user_id}>
                                                <div className="name">{user_info.name}</div>
                                                {
                                                    !user_info.db_exists &&
                                                    <div className="db-not-exists" title="데이터베이스가 없습니다.">
                                                        <RiErrorWarningLine/>
                                                    </div>
                                                }
                                                <div className="last-time">{Util.relativeTime(user_info.last_modified_time)}</div>
                                            </div>
                                        );
                                    })
                                }
                                <div className={"account " + (this.state.account_create_mode ? 'selected' : '')} onClick={this.accountCreateHandler}>
                                    <div className="name">계정 추가</div>
                                </div>
                            </div>
                        </div>
                        <div className="lower-input" style={{display: this.state.item_selected ? 'flex' : 'none'}}>
                            <input id="name_input" ref={this.name_input_ref} className={this.state.account_create_mode ? '' : 'invisible'} 
                                value={this.state.name_input}
                                placeholder="계정 이름을 입력하세요" 
                                onChange={this.nameInputChangeHandler}/>
                            <input id="pw_input" ref={this.pw_input_ref} type="password" placeholder="비밀번호를 입력하세요"
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

    accountSelectHandler = (account_id) => {
        this.pw_input_ref.current.focus();
        this.setState({
            item_selected: true,
            account_create_mode: false,
            selected_account_id: account_id,
            name_input: '',
            pw_input: ''
        });
    }
    
    accountCreateHandler = () => {
        this.name_input_ref.current.focus();
        this.setState({
            item_selected: true,
            account_create_mode: true,
            selected_account_id: null,
            name_input: '',
            pw_input: ''
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
            // TODO :: 기존 계정으로 로그인 (validatd pw)
            let pwInput = this.state.pw_input;
            let selectedUserId = this.state.selected_account_id;
            this.authenticate(selectedUserId, pwInput);
        }
    }

    authenticate = (id, pw) => {
        ipcRenderer.send('authenticate', {
            user_id: id,
            encrypted_pw: sha256(pw)
        });

        this.setState({
            encrypted_pw: sha256(pw)
        });
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