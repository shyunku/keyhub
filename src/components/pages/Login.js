import React, {Component} from 'react';
import TopActionBar from 'components/parts/TopActionBar';
import IpcRouter from 'components/routers/IpcRouter';

class Login extends Component{
    constructor(props){
        super(props);

        this.state = {
            item_selected: false,
            account_create_mode: false
        };
    }

    componentDidMount(){
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
                                <div className="account" onClick={this.accountSelectHandler}>
                                    <div className="name">shyunku</div>
                                    <div className="last-time">3일전</div>
                                </div>
                                <div className="account" onClick={this.accountSelectHandler}>
                                    <div className="name">션쿠</div>
                                    <div className="last-time">어제</div>
                                </div>
                                <div className="account" onClick={this.accountCreateHandler}>
                                    <div className="name">계정 추가</div>
                                </div>
                            </div>
                        </div>
                        <div className="lower-input" style={{display: this.state.item_selected ? 'flex' : 'none'}}>
                            <input id="name_input" className={this.state.account_create_mode ? '' : 'invisible'} placeholder="계정 이름을 입력하세요"></input>
                            <input id="pw_input" type="password" placeholder="비밀번호를 입력하세요"
                                onKeyDown={this.onPasswordInputDoneHandler}/>
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

    onPasswordInputDoneHandler = e => {
        if(e.keyCode === 13){
            if(this.state.account_create_mode){
                // 계정 생성 모드
                IpcRouter.floatAlert({
                    preferredWindowProperties: {
                        width: 240,
                        height: 225,
                    },
                    dataParam: {
                        is_warning:true,
                        text_list: ["Credit Connect 를 종료하시겠습니까?"],
                        confirm_button_label: "확인",
                        cancel_button_label: '취소',
                        cancel_origin_topic: this.cancel_callback_topic,
                        confirm_origin_topic: this.confirm_callback_topic
                    }
                });
                
            }else{

            }
        }
    }
}

export default Login;