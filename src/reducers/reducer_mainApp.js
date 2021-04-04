import { CLICK_MENU, 
  DRAG_TOOLITEM_START, 
  SELECT_TOOLPANEL_TREE, 
  FETCH_HIERARCHY, 
  FETCH_HIERARCHYVIEWS,
  FETCH_AVAILABLEDATA, 
  FETCH_SAVEDLAYOUTS,
  FETCH_IMAGES,
  SAVE_DESIGNER_LAYOUT } from "../actions/index";
import {DUMMY_APR_METADATA} from '../helper/dummyMetadata';

// Assumption: All these data is for 1 tenant only
const defaultState = {
    activeMenu: 'formsDesigner',
    tabIndex: 4,
    // temp state only, until react-grid-layout fixes the bug for onDrop parameters
    draggingToolItem: null,
    toolPanelTreeSelected: null,
    masterHierarchy: null,
    masterAvailableData: null,
    masterLayouts: [],
    masterHierarchyViews: null,
    // For the data retrieval
    masterMetadata: DUMMY_APR_METADATA,
    masterImages: []
}

// TODO: Should move this to a constant location
const tabIndexMapping = {
  mapView: 0,
  analysisView: 1,  
  home: 2,
  downloadCenter: 3,
  formsDesigner: 4,
  hierarchyDesigner: 5,
  //dataSources: 6,

  //affiliate: 6,
  // dashboardDesigner: 7,
  // dataDesigner: 8,
  // trialPage: 9,
  theme: 6,
  settings: 7
}

const addOrUpdateLayout = (stateLayouts, newLayout) => {
  let findSameLayoutIndex = stateLayouts.findIndex(s => s.name === newLayout.name);
  if (findSameLayoutIndex < 0) {
    stateLayouts.push(newLayout);
  }
  else {
    stateLayouts.splice(findSameLayoutIndex, 1, newLayout);
  }
}

export default function(state = defaultState, action) {
  if ([CLICK_MENU, DRAG_TOOLITEM_START, SELECT_TOOLPANEL_TREE, FETCH_HIERARCHY, FETCH_AVAILABLEDATA, SAVE_DESIGNER_LAYOUT, FETCH_HIERARCHYVIEWS, FETCH_IMAGES].includes(action.type)) {
    console.log('[DEBUG] reducer_mainApp', action, state);
  }
  switch (action.type) {
    case CLICK_MENU:
      return {
          ...state,
          activeMenu: action.payload,
          tabIndex: tabIndexMapping[action.payload]
      };
    case DRAG_TOOLITEM_START:
      return {
        ...state,
        draggingToolItem: action.payload
      }
    case FETCH_HIERARCHY:
      return {
        ...state,
        masterHierarchy: action.payload.data
      }
    case FETCH_AVAILABLEDATA:
      return {
        ...state,
        masterAvailableData: action.payload.data
      }
    case FETCH_SAVEDLAYOUTS:
      return {
        ...state,
        masterLayouts: action.payload.data
      }
    case SAVE_DESIGNER_LAYOUT:
      let newLayout = action.payload.response.data;
      let stateLayouts = [...state.masterLayouts];
      addOrUpdateLayout(stateLayouts, newLayout);
      return {
        ...state,
        masterLayouts: stateLayouts        
      }
    case FETCH_HIERARCHYVIEWS:
      return {
        ...state,
        masterHierarchyViews: action.payload.data
      }
    case FETCH_IMAGES:
      return {
        ...state,
        masterImages: action.payload.data
      }
  }
  return state;
}
