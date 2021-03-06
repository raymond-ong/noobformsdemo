import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import NoobSplitter from '../components/noobSplitter';
import DesignerContentbase from './designerContentBase';
import HierarchyTree from './hierearchyTree';
import ReportForm from '../components/reportForm';
import {selectDashboardTree} from '../actions';
import {findInheritedPage} from '../containers/hierarchyConfigPanel';
import {reconstructHierarchyStack, findNodeByKey} from '../helper/treefilter';
import './dashboardContent.css';
import { Button } from 'semantic-ui-react';
//import ShowMessage, { NotifType } from '../helper/notification';
import Form, {FormDateRange, FormFilterInput} from '../form/Form';
import {dateRangeDropdownOptions} from '../form/FormDateRange';

const DEFAULT_SPLIT_SIZES = [15, 85];


// Main Dashboard containing the Treeview (designed using Hierarchy Designer)
// and Dashboard contents (layout designed using Forms Designer)
class DashboardContent extends DesignerContentbase { 

    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            pageFilters: []
        };
    }

    onSelect = (selectedKeys, info) => {
        console.log("dashboard tree onSelect...", selectedKeys, info);
        if (selectedKeys.length > 0) {
            this.props.selectDashboardTree(
              selectedKeys[0]
            );
        }
        else {
            this.props.selectDashboardTree(null);
        }

        // Reset the page filter
        this.setState({pageFilters: []});
    }

    getLayoutName = (userSettings, treeData) => {
        let selectedNodeKey = this.props.selectedNodeKey;
        if (!selectedNodeKey || !userSettings) {
            return null;
        }

        // if there is an associated page, use that directly.
        let findUserSetting = userSettings.find(setting => setting.key === selectedNodeKey);        
        if (findUserSetting && findUserSetting.inherit === false) {
            return findUserSetting.pageAssoc;
        }
        else {
            // otherwise, use the inherited page
            let findNode = findNodeByKey(treeData, selectedNodeKey);
            if (!!findNode && findNode.item) {
                return findInheritedPage(findNode.item, userSettings);
            }            
        }

        return null;
    }

    getLayoutObj = (layoutName) => {
        let findLayout = this.props.masterLayouts && this.props.masterLayouts.find(layout => layout.name === layoutName);
        return {
            controls: findLayout && JSON.parse(findLayout.layoutJson),
            layoutData: findLayout && {
                rows: findLayout.numRows,
                columns: findLayout.numCols,
                pageFilterFields: findLayout.pageFilterFields && JSON.parse(findLayout.pageFilterFields),
                pageApiData: findLayout.pageApiData && JSON.parse(findLayout.pageApiData)
            }
        }
    }

    // This is for debugging only!
    renderDatasetFilters = () => {
        if (!this.props.chartClickFilters || Object.keys(this.props.chartClickFilters).length <= 0) {
            return null;
        }

        return (<table id="dashboardFiltersTable">
            <thead>
                <tr style={{border: "1px solid gray"}}>
                    <td>Dataset ID</td>
                    <td>Control ID</td>
                    <td>Stack ID</td>
                    <td>Own Filter</td>
                    <td>Own Series</td>
                    {/* <td>Carryover Filter</td> */}
                </tr>
            </thead>
            <tbody>
            {
                Object.keys(this.props.chartClickFilters).map((datasetId, iDataset) => {
                    let currDatasetFilters = this.props.chartClickFilters[datasetId];
                    return Object.keys(currDatasetFilters).map((currCtrlId, iCtrl) => {
                        let currControlFilter = currDatasetFilters[currCtrlId];   
                        return Object.keys(currControlFilter).map((currStackStr, iStack) => {
                            let currStackFilter = currControlFilter[currStackStr];
                            let sliceInfo = currStackFilter.sliceInfo;
                            let seriesInfo = currStackFilter.seriesInfo;
                            return <tr key={`filterTable-${iStack}`} style={{border: "1px solid gray"}}>
                                <td>Dataset: {datasetId}, </td>
                                <td>ControlId: {currCtrlId}, </td>
                                <td>Group: {currStackStr}, </td>
                                <td>{JSON.stringify(sliceInfo.origObj)}</td>
                                <td>{JSON.stringify(seriesInfo)}</td>
                                {/* <td>{JSON.stringify(currStackFilter.carryOverFilters)}</td> */}
                            </tr>
                        })
                        
                    })
                })
            }
            </tbody>
        </table>)
    }

    // For now, just hard code "analysis period". No time to implement proper checking!
    onSubmitFilter = (filterData, layoutObj) => {
        console.log('[dashboard filter submit]', filterData);
        if (!Array.isArray(layoutObj.layoutData.pageFilterFields)) {
            return;
        }
        let pageFiltersFormatted = [];
        layoutObj.layoutData.pageFilterFields.forEach(layoutFilter => {
            if (layoutFilter.toLocaleLowerCase() === 'analysisperiod') {
                pageFiltersFormatted.push({
                    name: "AnalysisPeriod",
                    value: filterData.AnalysisPeriod.value,
                    startDate: filterData.AnalysisPeriod.start,
                    endDate: filterData.AnalysisPeriod.end
                });
            }
            else if (!!filterData[layoutFilter] && filterData[layoutFilter].length > 0){
                pageFiltersFormatted.push({
                    name: layoutFilter,
                    value: filterData[layoutFilter]
                });
            }
    
        });

        this.setState({
            pageFilters: pageFiltersFormatted
        })
    }

    // Renders 1 filter
    renderPageFilter = (filterName, metadata) => {
        // Find the metadata first, then get the datatype, then render the filter based on the datatype
        // TODO: check the metadata
        if (filterName.toLocaleLowerCase() === 'analysisperiod') {
            return <FormDateRange key={'pageFilter_'+filterName} name={filterName} label="Analysis Period:"
            />
        }
        else {
            return <FormFilterInput key={'pageFilter_'+filterName} name={filterName}/>
        }
    }

    setPageFilterControlValues = (setValueFunc, pageFilterFields) => {
        if (!Array.isArray(pageFilterFields)) {
            return;
        }

        pageFilterFields.forEach(filterName => {
            if (filterName.toLocaleLowerCase() === 'analysisperiod') {
                setValueFunc("AnalysisPeriodValue", dateRangeDropdownOptions[0].value)
            }
        });
    }

    renderPageToolbar = (layoutObj, metadata, layoutName) => {
        if (!layoutObj || !layoutObj.layoutData || !Array.isArray(layoutObj.layoutData.pageFilterFields) || layoutObj.layoutData.pageFilterFields.length <= 0) {
            return null;
        }

        return <Form className="pageToolbar" 
            key='formDataDesigner' 
            onSubmit={(formData) => {this.onSubmitFilter(formData, layoutObj)}} 
            // onSubmit={data => {debugger}}
            setControlValues={this.setPageFilterControlValues}
            // watchedField={[]}
            // // inputObj: set it to the loaded data source when saving is implemented
            inputObj={layoutObj.layoutData.pageFilterFields} 
            inputObjId={layoutName}
            // setStateCb={setStateCb}
            >
            <div className="pageToolbarFieldContainer">
            {layoutObj.layoutData.pageFilterFields.map(pageFilter => {
                return (this.renderPageFilter(pageFilter, metadata));
            })}
            </div>    
            <div className="toolbarButtonContainer">
            <Button primary fluid={false} size='small'>Apply Filter</Button>
            </div>  
            </Form>
    }

    renderForm = (layoutName, layoutObj, metadata) => {
        if (!this.props.selectedNodeKey) {
            return <div className="ui message orange">Please select a node from the treeview on the left!</div>
        }
        return <div>
            {this.renderPageToolbar(layoutObj, metadata, layoutName)}
            {/* {this.renderDatasetFilters()} */}
            <ReportForm
                containerWidth={this.state.rightPixels}
                layoutData={layoutObj.layoutData}
                controls={layoutObj.controls}
                metadata={metadata}
                layoutName={layoutName}
                pageFilters={this.state.pageFilters}
            />
        </div>
    }
    
    render() {
        console.log('render dashboard...', this.props.selectedNodeKey);
        let treeData = this.props.hierarchyView && reconstructHierarchyStack(JSON.parse(this.props.hierarchyView.hierarchyJson));
        let userSettings = this.props.hierarchyView && JSON.parse(this.props.hierarchyView.nodeSettingsJson)
        let layoutName = this.getLayoutName(userSettings, treeData);
        let layoutObj = this.getLayoutObj(layoutName);
        // TODO: Put a minsize first. Should make the toolbar buttons responsive.
        // Given the selectedNode, render the appropriate layout
        return <NoobSplitter id="hierarchyDesigner" onDragEnd={this.onSplitDragEnd} defaultSize={DEFAULT_SPLIT_SIZES} minSize={230}>
            {this.props.hierarchyView && <HierarchyTree 
                    onSelectCb={this.onSelect} 
                    selectedNodeKey={this.props.selectedNodeKey}
                    // onHierarchyChanged={this.onHierarchyChanged}
                    treeData={treeData}
                    userSettings={userSettings}
                    controlledExpansion
                    hiddenNodesSettings={['displayAsMapView', 'displayAsAnalysisView']}
                    defaultExpandAll={true}
            />
            }
            {this.renderForm(layoutName, layoutObj, this.props.metadata)}            
        </NoobSplitter>
    }
}

function mapStateToProps(state) {
    // Select the appropriate hierarchy tree to be included into the props
    let masterHierarchyViews = state.mainApp.masterHierarchyViews;
    let defaultView = masterHierarchyViews && masterHierarchyViews[0];
    
    return {
        hierarchyView: defaultView,
        masterLayouts: state.mainApp.masterLayouts,
        selectedNodeKey: state.dashboard.selectedNodeKey,
        chartClickFilters: state.dashboard.chartClickFilters,
        metadata: state.mainApp.masterMetadata
    }
}
  
function mapDispatchToProps(dispatch) {
    return bindActionCreators({selectDashboardTree }, dispatch);
}
  
export default connect(mapStateToProps, mapDispatchToProps)(DashboardContent);