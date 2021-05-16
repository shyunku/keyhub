import React, {Component} from 'react';
import {IoMdClose} from 'react-icons/io';
import TopActionBar from 'components/parts/TopActionBar';
import IpcRouter from 'components/routers/IpcRouter';
import Util from 'assets/js/Util';

const electron = window.require("electron");
const {ipcRenderer} = electron;
const sha256 = require('sha256');

class Home extends Component{
    constructor(props){
        super(props);
        
        this.state = {
            selected_tab_label: 'category',
            search_keyword: ''
        }

        this.callback_create_folder_confirm = Util.generateUniqueTopic('create-folder');
    }

    componentDidMount(){
        ipcRenderer.on(this.callback_create_folder_confirm, (e, data) => {
            let itemName = data.create_item_input;
            
        });
    }

    render(){
        return(
            <div className="page">
                <TopActionBar/>
                <div id="home_page" className="page-content">
                    <div className="left-part container">
                        <div className="menu-bar">
                            <div className="tab selected" name="category">카테고리</div>
                            <div className="tab" name="setting">설정</div>
                        </div>
                        <div className="content">
                            <div className="categories">
                                <div className="category">
                                    <div className="name">일반</div>
                                    <div className="count">147개 항목</div>
                                </div>
                                <div className="category">
                                    <div className="name">개인</div>
                                    <div className="count">83개 항목</div>
                                </div>
                                <div className="category">
                                    <div className="name">회사</div>
                                    <div className="count">25개 항목</div>
                                </div>
                                <div className="category">
                                    <div className="name">게임</div>
                                    <div className="count">14개 항목</div>
                                </div>
                                <div className="create">
                                    <div className="add" onClick={this.createFolder}>폴더 추가</div>
                                    <div className="add">항목 추가</div>
                                </div>
                            </div>
                            <div className="route-path">{"일반 > 게임 > 리그오브레전드"}</div>
                            <div className="search-wrapper">
                                <input placeholder="항목을 검색하세요..." onChange={this.searchInputHandler} 
                                    value={this.state.search_keyword}/>
                                <div className="cancel-search-btn" onClick={this.flushSearcher}>
                                    <IoMdClose/>
                                </div>
                            </div>
                        </div>
                        {
                            {
                                categorys:<></>
                            }[this.state.selected_tab_label]
                        }
                    </div>
                    <div className="right-part container">

                    </div>
                </div>
            </div>
        );
    }

    searchInputHandler = e => {
        this.setState({search_keyword: e.target.value});
    }

    flushSearcher = () => {
        this.setState({search_keyword: ''});
    }

    createFolder = () => {
        IpcRouter.floatAsk({
            text_list: ['생성하려는 항목의 이름을 지정해주세요.'],
            use_confirm: true,
            confirm_topic: this.callback_create_folder_confirm,
            jsx: [
                {
                    type: 'input',
                    placeholder: '항목 이름을 입력하세요...',
                    enter_to_confirm: true,
                    name: 'create_item_input'
                }
            ]
        });
    }
}

export default Home;