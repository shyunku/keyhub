import React, {Component} from 'react';
import {IoMdClose, IoMdAddCircle, IoIosArrowForward} from 'react-icons/io';
import {IoChevronBack} from 'react-icons/io5';
import {FaFolder, FaFileAlt, FaFile} from 'react-icons/fa';
import TopActionBar from 'components/parts/TopActionBar';
import IpcRouter from 'components/routers/IpcRouter';
import Util from 'assets/js/Util';

const electron = window.require("electron");
const {ipcRenderer} = electron;
const sha256 = require('sha256');
const queryString = require('query-string');

class Home extends Component{
    constructor(props){
        super(props);
        const query = queryString.parse(props.location.search);
        const {derp, rpk} = query;
        
        this.root_folder = {
            name: 'Root',
            fid: null,
        };

        this.state = {
            selected_tab_label: 'key',
            search_keyword: '',
            folder_hierarchy_list: [this.root_folder],
            cur_fid: null,
            cur_iid: null,
            folders: [],
            items: [],
            keypairs: [],
            selected_item: null,
            item_tab: 'keypair',
            uid: query.uid,
            editing_folder_id: null,
            editing_item_id: null,
            encrypted_pw: Util.aes.decrypt(decodeURIComponent(derp), rpk)
        };

        window.document.title = 'keyhub';

        this.callback_create_folder_confirm = Util.generateUniqueTopic('create-folder');
        this.callback_create_item_confirm = Util.generateUniqueTopic('create-item');
        this.callback_create_keypair_confirm = Util.generateUniqueTopic('create-keypair');
        this.callback_delete_folder_only_confirm = Util.generateUniqueTopic('delete-folder-only');
        this.callback_delete_folder_all_confirm = Util.generateUniqueTopic('delete-folder-all');
        this.callback_delete_item_confirm = Util.generateUniqueTopic('delete-item');
        this.callback_delete_keypair_confirm = Util.generateUniqueTopic('delete-keypair');
    }

    componentDidMount(){
        const {folder_hierarchy_list, cur_fid} = this.state;

        ipcRenderer.on(this.callback_create_folder_confirm, (e, data) => {
            let itemName = data.create_item_input;
            if(itemName.length === 0){
                IpcRouter.floatAlert({
                    level: 1,
                    text_list: ['폴더명은 최소 1자 이상이어야 합니다.'],
                    use_confirm: true
                });
                return;
            }
            ipcRenderer.send('createFolder', {
                name: itemName,
                fid: this.state.cur_fid
            });
        });
        ipcRenderer.on(this.callback_create_item_confirm, (e, data) => {
            let itemName = data.create_item_input;

            if(itemName.length === 0){
                IpcRouter.floatAlert({
                    level: 1,
                    text_list: ['항목명은 최소 1자 이상이어야 합니다.'],
                    use_confirm: true
                });
                return;
            }

            ipcRenderer.send('createItem', {
                name: itemName,
                fid: this.state.cur_fid
            });
        });
        ipcRenderer.on(this.callback_create_keypair_confirm, (e, data) => {
            let key = data.create_key_input;
            let value = data.create_value_input;

            let encrypted_root_pw = sha256(data.create_root_pw_input);
            let encrypted_value = Util.aes.encrypt(value, encrypted_root_pw);

            if(key.length === 0 || value.length === 0){
                IpcRouter.floatAlert({
                    level: 1,
                    text_list: ['키와 값 모두 최소 1자 이상이어야 합니다.'],
                    use_confirm: true
                });
                return;
            }

            ipcRenderer.send('createKeypair', {
                iid: this.state.selected_item.iid,
                key,
                encrypted_value: encrypted_value,
                encrypted_root_pw: encrypted_root_pw,
                user_id: this.state.uid
            });
        });
        ipcRenderer.on(this.callback_delete_folder_only_confirm, (e, data) => {
            let target_folder = data.data;
            ipcRenderer.send('deleteFolderOnly', target_folder);
        });
        ipcRenderer.on(this.callback_delete_folder_all_confirm, (e, data) => {
            let target_folder = data.data;
            ipcRenderer.send('deleteFolderAll', target_folder);
        });
        ipcRenderer.on(this.callback_delete_item_confirm, (e, data) => {
            let target_item = data.data;
            ipcRenderer.send('deleteItem', target_item);
        });
        ipcRenderer.on('getAllFoldersByFid', (e, data) => {
            this.setState({
                folders: data
            });
        });
        ipcRenderer.on('getAllItemsByFid', (e, data) => {
            this.setState({
                items: data
            });
        });
        ipcRenderer.on('getAllKeypairsByIid', (e, data) => {
            this.setState({
                keypairs: data
            });
        });
        ipcRenderer.on('createFolder', (e, data) => {
            if(!data.success){
                IpcRouter.floatAlert({
                    level: 2,
                    text_list: [data.message],
                    use_confirm: true
                });
            }else{
                this.syncFolderItems(this.state.cur_fid);
            }
        });
        ipcRenderer.on('createItem', (e, data) => {
            if(!data.success){
                IpcRouter.floatAlert({
                    level: 2,
                    text_list: [data.message],
                    use_confirm: true
                });
            }else{
                this.syncFolderItems(this.state.cur_fid);
            }
        });
        ipcRenderer.on('createKeypair', (e, data) => {
            if(!data.success){
                IpcRouter.floatAlert({
                    level: 2,
                    text_list: [data.message],
                    use_confirm: true
                });
            }else{
                this.loadKeypairs(this.state.selected_item.iid);
            }
        });
        ipcRenderer.on('deleteFolderOnly', (e, data) => {
            if(!data.success){
                IpcRouter.floatAlert({
                    level: 2,
                    text_list: [data.message],
                    use_confirm: true
                });
            }else{
                this.syncFolderItems(this.state.cur_fid);
            }
        });
        ipcRenderer.on('deleteFolderAll', (e, data) => {
            if(!data.success){
                IpcRouter.floatAlert({
                    level: 2,
                    text_list: [data.message],
                    use_confirm: true
                });
            }else{
                this.syncFolderItems(this.state.cur_fid);
            }
        });
        ipcRenderer.on('deleteItem', (e, data) => {
            if(!data.success){
                IpcRouter.floatAlert({
                    level: 2,
                    text_list: [data.message],
                    use_confirm: true
                });
            }else{
                this.syncFolderItems(this.state.cur_fid);
            }
        });

        this.syncFolderItems(null);

        setInterval(() => {
            this.forceUpdate();
        }, 1000);

        window.addEventListener('click', this.unfocusEntryEditMode);
    }

    unfocusEntryEditMode = (e) => {
        let target = e.target;

        // console.log(target.classList);
        this.setState({
            editing_folder_id: null,
            editing_item_id: null
        });
    }

    componentWillUnmount(){
        ipcRenderer.removeAllListeners();
    }

    render(){
        const {folder_hierarchy_list, cur_iid, selected_item} = this.state;

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
                                        {
                                            this.state.cur_fid !== null &&
                                            <div className="navigator">
                                                <div className="back-btn" onClick={this.backPathHistory}><IoChevronBack/>상위 폴더로 가기</div>
                                            </div>
                                        }
                                        <div className="entries">
                                            {
                                                this.state.folders.map(folder => (
                                                    <div className="entry-item" key={folder.fid} onClick={e => this.enterFolder(folder)}
                                                        onContextMenu={e => this.openFolderOption(folder)}>
                                                        <div className="icon"><FaFolder/></div>
                                                        <div className="name-cover">
                                                            <div className="name folder">{folder.name}</div>
                                                            <div className="count">({folder.count})</div>
                                                        </div>
                                                        <div className={"controller " + (this.state.editing_folder_id === folder.fid ? 'focus' : '')}>
                                                            <div className="edit un-unfocusable">수정</div>
                                                            <div className="del un-unfocusable" onClick={e => this.deleteFolder(e, folder)}>삭제</div>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                            {
                                                this.state.items.map(item => (
                                                    <div className="entry-item" key={item.iid} onClick={e => this.revealItem(item)}
                                                        onContextMenu={e => this.openItemOption(item)}>
                                                        <div className="icon"><FaFileAlt/></div>
                                                        <div className="name">{item.name}</div>
                                                        <div className={"controller " + (this.state.editing_item_id === item.iid ? 'focus' : '')}>
                                                            <div className="edit un-unfocusable">수정</div>
                                                            <div className="del un-unfocusable" onClick={e => this.deleteItem(e, item)}>삭제</div>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                            <div className="create">
                                                <div className="add" onClick={this.createFolder}>폴더 추가</div>
                                                <div className="add" onClick={this.createItem}>항목 추가</div>
                                            </div>
                                        </div>
                                        <div className="route-path">
                                            <div className="path-list">
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
                    {
                        cur_iid ?
                        <div className="folder-item info-container">
                            <div className="item-path">{selected_item.history}</div>
                            <div className="item-summary">
                                <div className="item-name">{selected_item.name}</div>
                                <div className="item-representives">생성: {Util.relativeTime(selected_item.created_timestamp)}</div>
                            </div>
                            <div className="contents">
                                <div className="main-content">
                                    {
                                        this.state.keypairs.map((kp, ind) => {
                                            return(
                                                <div className="key-pair" key={ind}>
                                                    <div className="key"><div>{kp.key}</div></div>
                                                    <div className="value-wrapper">
                                                        <div>{Util.aes.decrypt(kp.encrypted_value, this.state.encrypted_pw)}</div>
                                                    </div>
                                                </div>
                                            );
                                            
                                        })
                                    }
                                    <div className="key-pair add" onClick={this.createKeypair}>
                                        <div className="icon"><IoMdAddCircle/></div>
                                        <div className="label">키페어 추가</div>
                                    </div>
                                </div>
                            </div>
                        </div> :
                        <div className="item-info info-container">
                            <div className="item-path">
                                {folder_hierarchy_list.map(e => e.name).join(' > ')}
                            </div>
                            <div className="item-summary">
                                <div className="item-name">{folder_hierarchy_list[folder_hierarchy_list.length - 1].name}</div>
                            </div>
                        </div>
                    }
                    </div>
                </div>
            </div>
        );
    }

    deleteFolder = (e, folder) => {
        e.stopPropagation();

        IpcRouter.floatAsk({
            level: 1,
            text_list: [`'${folder.name}' 폴더가 영구 삭제됩니다.`, '계속하시겠습니까?'],
            jsx: [
                {
                    type: 'button',
                    text: '해당 폴더와 하위 폴더 및 항목 모두 삭제',
                    class: ['danger'],
                    callback_topic: this.callback_delete_folder_all_confirm
                },
                {
                    type: 'button',
                    text: '해당 폴더만 삭제',
                    class: ['std'],
                    callback_topic: this.callback_delete_folder_only_confirm
                }
            ],
            use_cancel: true,
            data: folder
        });
    }

    deleteItem = (e, item) => {
        e.stopPropagation();

        IpcRouter.floatAsk({
            level: 1,
            text_list: [`'${item.name}' 항목이 영구 삭제됩니다.`, '계속하시겠습니까?'],
            jsx: [
                {
                    type: 'button',
                    text: '삭제',
                    class: ['std'],
                    callback_topic: this.callback_delete_item_confirm
                }
            ],
            use_cancel: true,
            data: item
        });
    }

    openFolderOption = folder => {
        this.setState({
            editing_folder_id: folder.fid,
            editing_item_id: null
        });
    }

    openItemOption = item => {
        this.setState({
            editing_folder_id: null,
            editing_item_id: item.iid
        });
    }

    enterFolder = folder => {
        let {folder_hierarchy_list} = this.state;
        let finder = f => f.fid === folder.fid;

        if(folder_hierarchy_list.find(finder)){
            // history에 폴더 존재
            let history_index = folder_hierarchy_list.findIndex(finder);
            folder_hierarchy_list = folder_hierarchy_list.slice(0, history_index + 1);
        }else{
            folder_hierarchy_list.push(folder);
        }

        this.setState({
            cur_fid: folder.fid,
            folder_hierarchy_list,
            editing_folder_id: null,
            editing_item_id: null
        });
        this.syncFolderItems(folder.fid);
    }

    revealItem = item => {
        item.history = this.state.folder_hierarchy_list.map(f => f.name).join(' > ');
        this.setState({
            cur_iid: item.iid,
            selected_item: item
        });
        this.loadKeypairs(item.iid);
    }

    loadKeypairs = iid => {
        ipcRenderer.send('getAllKeypairsByIid', {
            iid: iid
        });
    }

    backPathHistory = () => {
        let {folder_hierarchy_list} = this.state;
        folder_hierarchy_list.splice(-1, 1);
        let cur_fid = folder_hierarchy_list[folder_hierarchy_list.length - 1].fid;

        this.setState({
            cur_fid: cur_fid,
            folder_hierarchy_list
        });
        this.syncFolderItems(cur_fid);
    }

    syncFolderItems = (cur_fid) => {
        ipcRenderer.send('getAllFoldersByFid', {
            cur_fid: cur_fid
        });
        ipcRenderer.send('getAllItemsByFid', {
            cur_fid: cur_fid
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
            text_list: ['폴더 생성'],
            use_confirm: true,
            confirm_topic: this.callback_create_folder_confirm,
            jsx: [
                {
                    type: 'input',
                    placeholder: '폴더 이름을 입력하세요...',
                    enter_to_confirm: true,
                    name: 'create_item_input'
                }
            ]
        });
    }
    createItem = () => {
        IpcRouter.floatAsk({
            text_list: ['항목 생성'],
            use_confirm: true,
            confirm_topic: this.callback_create_item_confirm,
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
    createKeypair = () => {
        IpcRouter.floatAsk({
            text_list: ['키페어 생성'],
            use_confirm: true,
            confirm_topic: this.callback_create_keypair_confirm,
            jsx: [
                {
                    type: 'input',
                    placeholder: '키 이름(비밀번호, 이메일 등)을 입력하세요...',
                    enter_to_confirm: true,
                    name: 'create_key_input'
                },
                {
                    type: 'input',
                    placeholder: '해당 키의 값을 입력하세요...',
                    enter_to_confirm: true,
                    name: 'create_value_input'
                },
                {
                    type: 'input',
                    placeholder: '사용자 비밀번호를 입력하세요...',
                    enter_to_confirm: true,
                    name: 'create_root_pw_input',
                    hide: true
                }
            ]
        }, {
            width: 400
        });
    }
}

export default Home;