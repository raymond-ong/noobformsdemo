import React from 'react';
import { bindActionCreators } from "redux";
import NoobSplitter from '../components/noobSplitter';
import ToolPanel from '../components/toolPanel';
import DesignerForm from '../components/designerForm';
import DesignerContentbase from './designerContentBase';
//import DesignerToolbar from '../components/designerToolbar';
import Toolbar from '../components/toolbar';
import NoobForm from '../components/noobForm';
import './designerCommon.css';
import {saveLayout, openLayout, selectedPage} from '../actions';
import ShowMessage, {NotifType} from '../helper/notification';

import {connect} from 'react-redux';
import SaveAsDialog from '../components/saveAs';
import OpenDialog from '../components/openDialog';

const DEFAULT_SPLIT_SIZES = [25, 75];

const panelItems = [
    {
        title: 'Toolbox',
        id: 'toolbox',
        isCollapsed: false,
        size: 0,
        helpText: 'Drag an item to the Designer Area'
    },
    {
        title: 'Properties',
        id: 'properties',
        isCollapsed: false,
        size: 0,
        helpText: 'Please select an item from the Designer Area to view the properties'
    },
]


class formsDesignerContent extends DesignerContentbase {
    constructor(props) {
        super(props);
        //this.defaultSizes = DEFAULT_SPLIT_SIZES;
        this.menuItems = {
            'left': [
                {key:'designertb_save', icon: 'save', text: 'Save', callback: this.saveCallback},
                {key:'designertb_saveas', icon: 'save outline', text: 'Save As...', callback: this.saveAsCallback},
                {key:'designertb_open', icon: 'open folder outline', text: 'Open...', callback: this.openCallback},
                
            ],
            'right': [
                //{key:'designertb_preview', icon: 'eye', text: 'Hold to Preview', disabled: true},
                {key:'designertb_configPage', icon: 'window maximize outline', text: 'Configure Page Settings', callback: this.configPageSettings},
            ]
        }

        this.state = {
            ...this.state,
            showSaveForm: false,
            showOpenForm: false,
            openedLayoutName: null,            
        }
    }

    configPageSettings = () => {
        // Fire a redux action to select the page, and unselect any selected control
        this.props.selectedPage();
    }

    saveCallback = () => {
        console.log('Save callback', this.props.layoutData);
        // If untitled, call Save As callback
        if (!this.props.layoutData.name) {
            this.saveAsCallback();
        }
        else {
            this.handleSave(this.props.layoutData.name);
        }
    }
    
    saveAsCallback = () => {
        console.log('Save As callback');
        // Popup the dialog to ask user to input name
        this.setState({
            showSaveForm: true
        })        
    }

    handleSave = async (layoutName) => {
        console.log('Save the layout...', layoutName);
        let result = await this.props.saveLayout(this.props.layout, layoutName, this.props.layoutData); // dispatch redux action
        if (result === true) {
            ShowMessage("Layout Saved!");
            // Also "open" this now
            this.setState({
                openedLayoutName: layoutName
            })
        }
        else {
            ShowMessage("Failed to Save Layout!", NotifType.danger, result.message);
        }
        this.handleCloseSave();

        // Also fire a redux action to "open" the newly saved form
        let layoutToUse = this.getLayoutToUse(layoutName);
        this.props.openLayout(layoutToUse.controls, layoutToUse.layoutData)
    }

    handleCloseSave = () => {
        console.log('handleCloseSave');
        if (this.state.showSaveForm) {
            this.setState({
                showSaveForm: false
            })
        }
    }
    
    openCallback = () => {
        console.log('Open callback');
        this.setState({
            showOpenForm: true
        });
    }

    // For closing the Open-Layout Dialog
    handleCloseOpenDlg = () => {
        console.log('handleCloseSave');
        if (this.state.showOpenForm) {
            this.setState({
                showOpenForm: false
            })
        }
    }

    // After the user has selected a layout, then clicked open
    handleOpenLayout = (layoutName) => {
        // 
        if (this.state.showOpenForm) {
            this.setState({
                openedLayoutName: layoutName,
                showOpenForm: false
            })
        }

        // Also fire a redux action to update
        let layoutToUse = this.getLayoutToUse(layoutName);
        this.props.openLayout(layoutToUse.controls, layoutToUse.layoutData)
    }

    getLayoutToUse = (openedLayoutName) => {
        // If the user did not open, just use the default layout from the reducer
        let defaultReturn = {
            controls: this.props.layout,
            layoutData: this.props.layoutData, 
            title: "Untitled",
            titleTooltip: "Form is not yet saved"
        };

        if (!openedLayoutName) {
            return defaultReturn;
        }

        // Find 
        let layoutFromApi = this.props.savedLayouts.find(x => x.name === openedLayoutName);
        if (!layoutFromApi) {
            return defaultReturn;
        }
        return {
            controls: JSON.parse(layoutFromApi.layoutJson),
            layoutData: {
                name: layoutFromApi.name,
                columns: layoutFromApi.numCols,
                rows: layoutFromApi.numRows,
                pageFilterFields: layoutFromApi.pageFilterFields && JSON.parse(layoutFromApi.pageFilterFields),
                pageApiData: layoutFromApi.pageApiData && JSON.parse(layoutFromApi.pageApiData),
            },
            title: layoutFromApi.name,
            titleTooltip: "Last saved on " + layoutFromApi.lastUpdateDate
        };
    }
    
    render() {
        console.log('render designerContent', this.props.savedLayouts);
        let options = Array.isArray(this.props.savedLayouts) &&
                    this.props.savedLayouts.map((layout) => {return {key: `option_${layout.name}`, text: layout.name, value: layout.name}});
        let layoutToUse = this.getLayoutToUse(this.state.openedLayoutName);

        return <NoobSplitter id="designerPanel" onDragEnd={this.onSplitDragEnd} defaultSize={DEFAULT_SPLIT_SIZES}>
            <ToolPanel panelItems={panelItems} containerWidth={this.state.leftPixels}/>
            <div id="rightContainer" className="designerContainer">
                {/* <DesignerToolbar containerWidth={this.state.rightPixels}/> */}
                <Toolbar 
                    containerWidth={this.state.rightPixels}
                    menuItems={this.menuItems}
                    title={layoutToUse.title}
                    titleTooltip={layoutToUse.titleTooltip}
                />
                <div className="layoutEditorContainer">
                    <NoobForm 
                        containerWidth={this.state.rightPixels}
                        // layoutData={layoutToUse.layoutData}
                        // controls={layoutToUse.controls}
                        layoutData={this.props.layoutData}
                        controls={this.props.layout}
                        />
                </div>
                <SaveAsDialog showSaveForm={this.state.showSaveForm}
                            title={"Save Layout"}
                            formLabel={"Layout name:"}
                            onSave={this.handleSave}
                            onClose={this.handleCloseSave}
                />
                <OpenDialog showOpenForm={this.state.showOpenForm}
                            title={"Open Layout"}
                            formLabel={"Layout name:"}
                            onOpen={this.handleOpenLayout}
                            onClose={this.handleCloseOpenDlg}
                            options={options}
                />
            </div>
        </NoobSplitter>
    }
}

const mapStateToProps = (state) => {
    return {
        layout: state.designer.layout,
        layoutData: state.designer.layoutData,
        metadata: state.designer.metadata,
        savedLayouts: state.mainApp.masterLayouts
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({ saveLayout, openLayout, selectedPage }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(formsDesignerContent);