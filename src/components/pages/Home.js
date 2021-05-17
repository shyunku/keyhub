import React, {Component} from 'react';
import {IoMdClose} from 'react-icons/io';
import {IoIosArrowForward} from 'react-icons/io';
import TopActionBar from 'components/parts/TopActionBar';
import IpcRouter from 'components/routers/IpcRouter';
import Util from 'assets/js/Util';

const electron = window.require("electron");
const {ipcRenderer} = electron;
const sha256 = require('sha256');

class Home extends Component{
    constructor(props){
        super(props);
        
        this.root_folder = {
            name: 'Root',
            fid: null,
        };

        this.state = {
            selected_tab_label: 'key',
            search_keyword: '',
            folder_hierarchy_list: [this.root_folder],
            cur_fid: null,
            folders: [],
            items: []
        };

        this.callback_create_folder_confirm = Util.generateUniqueTopic('create-folder');
    }

    componentDidMount(){
        const {folder_hierarchy_list, cur_fid} = this.state;

        ipcRenderer.on(this.callback_create_folder_confirm, (e, data) => {
            let itemName = data.create_item_input;
            
        });

        ipcRenderer.on('getAllFoldersByFid', (e, data) => {
            console.log(data);
            this.setState({
                folders: data
            });
        });

        this.syncFolderItems(null);
    }

    render(){
        const {folder_hierarchy_list} = this.state;

        return(
            <div className="page">
                <TopActionBar/>
                <div id="home_page" className="page-content">
                    <div className="left-part container">
                        <div className="menu-bar">
                            <div className="tab selected" name="category">키</div>
                            <div className="tab" name="setting">설정</div>
                        </div>
                        <div className="content">
                        {
                            {
                                key:
                                    <>
                                        <div className="entries">
                                            {
                                                this.state.folders.map(folder => (
                                                    <div className="entry-item" key={folder.fid} onClick={e => this.enterFolder(folder)}>
                                                        <div className="name">{folder.name}</div>
                                                        <div className="count">10개 항목</div>
                                                    </div>
                                                ))
                                            }
                                            <div className="create">
                                                <div className="add" onClick={this.createFolder}>폴더 추가</div>
                                                <div className="add">항목 추가</div>
                                            </div>
                                        </div>
                                        <div className="route-path">
                                            {
                                                folder_hierarchy_list.map((f, ind) => {
                                                    return (
                                                        <div className="path-history" key={ind}
                                                            onClick={e => {this.enterFolder(f);}}>
                                                            <div className="fname">{f.name}</div>
                                                            {
                                                                ind !== folder_hierarchy_list.length - 1 &&
                                                                <div className="arrow">
                                                                    <IoIosArrowForward/>
                                                                </div>
                                                            }
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                        <div className="search-wrapper">
                                            <input placeholder="항목을 검색하세요..." onChange={this.searchInputHandler} 
                                                value={this.state.search_keyword}/>
                                            <div className="cancel-search-btn" onClick={this.flushSearcher}>
                                                <IoMdClose/>
                                            </div>
                                        </div>
                                    </>
                            }[this.state.selected_tab_label]
                        }
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

    enterFolder = folder => {
        const {folder_hierarchy_list} = this.state;
        let finder = f => f.fid === folder.fid;

        if(folder_hierarchy_list.find(finder)){
            // history에 폴더 존재
            let history_index = folder_hierarchy_list.findIndex(finder);
            folder_hierarchy_list.slice(0, history_index - 1);
        }else{
            folder_hierarchy_list.push(folder);
        }

        this.setState({
            cur_fid: folder.fid,
            folder_hierarchy_list
        });
        this.syncFolderItems(folder.fid);
    }

    syncFolderItems = (cur_fid) => {
        // TODO :: 해당 위치의 폴더 및 항목 가져오기
        ipcRenderer.send('getAllFoldersByFid', {
            cur_fid: cur_fid || this.state.cur_fid
        });
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