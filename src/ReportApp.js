import React from 'react';
import ReportForm from './components/reportForm';
import {connect} from 'react-redux';
import './ReportApp.css'
import {findInheritedPage} from './containers/hierarchyConfigPanel';
import {findNodeByKey} from './helper/treefilter';
import {uuidv4, getMonthEndDate, getMonthStartDate} from './helper/util';

const ReportApp = ({layoutData, layout, metadata, hierarchyView, masterLayouts}) => {

    const getLayoutName = (findUserSetting, currNode) => {
        if (!findUserSetting) {
            return null;
        }

        if (findUserSetting.inherit === false) {
            return findUserSetting.pageAssoc;
        }
        else {
            // otherwise, use the inherited page
            let findNode = findNodeByKey(treeData, currNode.key);
            if (!!findNode && findNode.item) {
                return findInheritedPage(findNode.item, userSettings);
            }
        }

        return null;
    }

    // Returns an array of layouts
    const extractLayouts = (nodesArr) => {
        if (!Array.isArray(nodesArr) || !Array.isArray(userSettings)) {
            return null;
        }

        let retList = [];
        for (let i=0; i < nodesArr.length; i++) {
            let currNode = nodesArr[i];
            // Find the corresponding userSetting and layoutObj
            // We cannot call continue in the loop if cannot find the setting/layout, because we still need to process the children
            let findUserSetting = userSettings.find(u => u.key === currNode.key);
            if (findUserSetting && findUserSetting.displayReport === true) {
                let layoutName = getLayoutName(findUserSetting, currNode);
                let findNodeLayout = masterLayouts.find(m => m.name === layoutName);
                if (findNodeLayout) {
                    let controlsArr = findNodeLayout.layoutJson && JSON.parse(findNodeLayout.layoutJson);
                    let pageApiData = findNodeLayout.pageApiData && JSON.parse(findNodeLayout.pageApiData);
                    retList.push({
                        layoutName: layoutName,
                        controls: controlsArr,
                        pageApiData: pageApiData
                    });
                    console.log("[extractLayouts] Adding: ", layoutName);
                }
            }

            // process the node's children (always process the children no matter what)
            let childrenControls = extractLayouts(currNode.children);
            if (Array.isArray(childrenControls) && childrenControls.length > 0) {
                retList = retList.concat(childrenControls);
            }
        }

        return retList;
    }

    const adjustControlCoords = (currLayoutControls, currRowOffset, currLayoutName) => {
        let retVal = {
            lastNonEmptyRow: 0,
            adjustedControls: []
        };
        
        for (let i=0; i < currLayoutControls.length; i++) {
            let currControl = currLayoutControls[i];
            let newY = currControl.y + currRowOffset;
            let bottom = newY + currControl.h;
            retVal.adjustedControls.push({
                ...currControl,
                y: newY,
                layoutName: currLayoutName // needed for external API data mapping
            })

            if (bottom > retVal.lastNonEmptyRow) {
                retVal.lastNonEmptyRow = bottom;
            }
        }

        return retVal;
    }

    const mergeLayoutControls = (allLayouts) => {
        if (!Array.isArray(allLayouts)) {
            return [];
        }

        let retVal = {
            controls: [],
            lastNonEmptyRow: 0,
            apiDataMap:  {}
        };
        let currRowOffset = 0;
        for (let iLayout = 0; iLayout < allLayouts.length; iLayout++) {
            let currLayoutName = allLayouts[iLayout].layoutName;
            let currLayoutControls = allLayouts[iLayout].controls;
            let currApiData = allLayouts[iLayout].pageApiData;
            if (currApiData) {
                retVal.apiDataMap[currLayoutName] = currApiData;
            }
            
            let reformattedControls = adjustControlCoords(currLayoutControls, currRowOffset, currLayoutName);
            console.log('[mergeLayoutControls], layout: ', currLayoutName, 'last empty row', reformattedControls.lastNonEmptyRow, "currRowOffset:", currRowOffset);
            // Add a pagebreak
            reformattedControls.adjustedControls.push({
                i: 'ctrl-pagebreak-report'+uuidv4(),
                x: 0,
                y: reformattedControls.lastNonEmptyRow+1,
                w: 12,
                h: 1,
                ctrlType: 'pagebreak',
                data: {}
            });

            currRowOffset = reformattedControls.lastNonEmptyRow + 2; // +1 for the page break we added just now
            retVal.controls = retVal.controls.concat(reformattedControls.adjustedControls);
        }

        retVal.lastNonEmptyRow = currRowOffset;

        return retVal;
    }

    const gatherAllControls = () => {        
        if (!treeData || treeData.length === 0) {
            return [];
        }

        // Extract all layouts first
        let allLayouts = extractLayouts(treeData);

        // Stitch together all controls, but need to readjust the x, y coordinates
        // and put a page break control in between each layout
        return mergeLayoutControls(allLayouts);
    }

    // For now, we hardcode that if report parameters include "start" and "end", it is for Analysis Period
    // Since Analysis Period is already part of the DashboardContent's state.pageFilters, we just mimic the format.
    // Future: may include report name, or username
    const getRequestParamsOld = () => {
        let url = new URL(document.URL);
        let searchParams = url.searchParams;
        const start = searchParams.get('start');
        const end = searchParams.get('end');
        let pageFilters = [];

        // TODO: Not sure if backend server can understand the start and end date format
        if (start && end) {
            pageFilters.push({
                name: "AnalysisPeriod", 
                value: "CustomRange", 
                startDate: start,
                endDate: end
            });
        }

        return pageFilters;
    }

    // For now, we hardcode that the request parameter shall be the Exec Report UUID, start and end MONTH
    // Since Analysis Period is already part of the DashboardContent's state.pageFilters, we just mimic the format.
    // Future: may include report name, or username
    const getRequestParams = () => {
        let url = new URL(document.URL);
        let searchParams = url.searchParams;
        const start = searchParams.get('start');
        const end = searchParams.get('end');
        const uuid = searchParams.get('uuid');
        let pageFilters = [];

        if (uuid) {
            pageFilters.push({
                name: 'uuid',
                value: uuid
            });
        }
        if (start && end) {
            pageFilters.push({
                name: "AnalysisPeriod", 
                value: "CustomRange", 
                startDate: getMonthStartDate(new Date(start)),
                endDate: getMonthEndDate(new Date(end))
            });
        }

        return pageFilters;
    }

    // temp function
    const getFirstVal = (obj) => {
        if (!obj) {
            return null;
        }

        let vals = Object.values(obj);
        if (vals && vals.length > 0) {
            return vals[0];
        }

        return null;
    }

    // Gather all controls from all layouts in the hierarchy and pass them as controls and layoutData
    let treeData = hierarchyView && JSON.parse(hierarchyView.hierarchyJson);
    let userSettings = hierarchyView && JSON.parse(hierarchyView.nodeSettingsJson);
    
    let allControls = gatherAllControls();
    let allControlsLayoutData = {
        columns: 12,
        rows: allControls.lastNonEmptyRow + 1,
        // TODO: For now, don't send the whole apiDataMap first. Assume in all layouts selected, only one of them has external API Data
        pageApiData: getFirstVal(allControls.apiDataMap)
    };

    // Parse the URL for the query string
    let requestParams = getRequestParams();
    console.log('requestParams: ', requestParams);

    return <div className="ReportApp">
        <ReportForm 
            containerWidth={window.innerWidth}
            // layoutData={layoutData}
            // controls={layout}
            layoutData={allControlsLayoutData}
            controls={allControls.controls}            
            metadata={metadata}
            pageFilters={requestParams}
            />
    </div>
}

const mapStateToProps = (state) => {    
    let masterHierarchyViews = state.mainApp.masterHierarchyViews;
    let defaultView = masterHierarchyViews && masterHierarchyViews[0];

    return {
        layout: state.reportApp.layout,
        layoutData: state.reportApp.layoutData,
        metadata: state.mainApp.masterMetadata,
        hierarchyView: defaultView,
        masterLayouts: state.mainApp.masterLayouts,
    };
}

export default connect(mapStateToProps)(ReportApp);