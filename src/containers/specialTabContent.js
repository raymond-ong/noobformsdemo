import React from 'react';
import { useSelector } from 'react-redux';
import './specialTabContent.css';
import ReportForm from '../components/reportForm';

//hierarchyPropName: In the Hierarchy Designer, there is a checkbox for "displayAsMapView" and "displayAsAnalysisView"
// Expectation is that user will tick the checkbox for ONE hierarchy.
// Basically this tab will display the first hierarchy with that tick (if there are more than one).
const SpecialTabContent = ({hierarchyPropName}) => {

    // Nested functions - START
    const findFirstNode = (userSettings) => {
        if (!userSettings) {
            return null;
        }

        return userSettings.find(u => u[hierarchyPropName] === true);
    }

    const getLayoutObj = (layoutName, masterLayouts) => {
        let findLayout = masterLayouts && masterLayouts.find(layout => layout.name === layoutName);
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
    // Nested functions - END

    // Find from the redux store the first hierarchy with {hierarchyPropName} checked
    const masterHierarchyViews = useSelector(state => state.mainApp.masterHierarchyViews);
    const masterLayouts = useSelector(state => state.mainApp.masterLayouts);
    const metadata = useSelector(state => state.mainApp.masterMetadata);
    let defaultView = masterHierarchyViews && masterHierarchyViews[0];
    let userSettings = defaultView && JSON.parse(defaultView.nodeSettingsJson);

    let findSettingNode = findFirstNode(userSettings);
    if (!findSettingNode) {
        return <div>Loading...</div>;
    }

    let layoutName = findSettingNode.pageAssoc;
    // Note: For now, just assume that special tabs have a pageAssoc defined, instead of inherited page
    // So that we don't need to go and find the inherited page from the hierarchy tree
    let layoutObj = getLayoutObj(layoutName, masterLayouts);

    return <div className="specialTabContainer">
        <ReportForm
            containerWidth={window.innerWidth}
            layoutData={layoutObj.layoutData}
            controls={layoutObj.controls}
            metadata={metadata}
            layoutName={layoutName}
            pageFilters={null}
        />
    </div>
}

export default SpecialTabContent;