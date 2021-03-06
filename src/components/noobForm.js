import React, { Component } from 'react';
import './noobForm.css';
import NoobControl from './noobControl';
import {connect} from 'react-redux';
import { bindActionCreators } from "redux";
import { updateLayout } from '../actions/index';
import {ControlDragTypes} from './noobControlContent';
import { WIDTH_LARGE } from '../constants';

const ROW_HEIGHT = 50;
const CONTROL_PADDING = 20;
const GRID_GAP = 5;

// CSS Grid based layout editor, instead of using react-grid-layout
// problems with RGL:
// [1] combobox multiselect: Griditem size does not expand based on the child content's size
// [2] if {useCssTransform = true}, there will be overlap problems with the combobox dropdown.
//     side effect of setting it to false is that drag and drop becomes unpredictable with Drag-from-outside
// But of course, there are many good features in RGL that might be difficult to recreate:
// [1] Animations, on-the fly preview
//      - might not be feasible with CSS Grid/current design. Anyways, this is just cosmetic.
// [2] Auto-arrange elements on DnD
// [3] Opaque Drag image. RGL's Drag image looks very nice because the Drag Image is 100% Opaque
//     In Chrome, Native DnD from HTML5 looks weird as it is semi-transparent with some gradient
//     In Edge, the drag image also looks different.
//  => React DnD Supports "Custom Drag Layer"...TODO: Experiment on this. From the examples, this also works on touch backend.
//  => This way, the drag previews will be consistent across all browsers.

// use destructuring to capture all the properties passed from upper component
//const NoobForm = ({containerWidth, controls, layoutProps, eventCallbacks}) => {
class NoobForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            // Possible optimization: save all the DOM elements of the controls to the state
            // Because while resizing, there is a need to find all control Id's using DOM query
            // Maybe get a fresh copy of all DOM elements during mousedown of the resizer
            resizingControlId: null,        
        };
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onResizerMouseDown = this.onResizerMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onDropControl = this.onDropControl.bind(this);
        this.checkDroppable = this.checkDroppable.bind(this);
    }

    // for handling resizing operations
    onMouseMove(e, controlIds) {
        if (this.state.resizingControlId == null) {
            return;
        }

        // [1] Find the DOM Control via document query
        let domControl = this.findControlDomById(this.state.resizingControlId);
        if (domControl === null) {
            return;
        }


        let rectContainer = domControl.container.getClientRects()[0];

        let yDelta = !!e.touches ? e.touches[0].clientY - rectContainer.bottom: e.clientY - rectContainer.bottom;
        let xDelta = !!e.touches ? e.touches[0].clientX - rectContainer.right : e.clientX - rectContainer.right;

        if (!domControl.container.classList.contains('resizingControl')) {
            domControl.container.classList.add('resizingControl');
            domControl.content.classList.add('resizingContent');
        }   

        domControl.placeholder.style.height = `${this.state.origHeight - 2}px`;
        domControl.placeholder.style.width = `${this.state.origWidth - 2}px`;
        //debugger
        // console.log('onMouseMove....', this.state.origHeight);

        //console.log('MouseMove/TouchMove', yDelta, xDelta);

        // [2] Set the new width and height based on the mouse position
        domControl.content.style.width = `${rectContainer.width + xDelta}px`;
        domControl.content.style.height = `${rectContainer.height + yDelta}px`;

        let rectResizing = domControl.content.getClientRects()[0];

        // [3] Check overlaps with other controls - highlight them
        this.checkOverlaps(this.state.resizingControlId, rectResizing, controlIds); // overlap with other controls

        // [4] Check overlaps with landing pad - highlight them
        this.checkLandingPadOverlap(this.state.resizingControlId, rectContainer, rectResizing);

    }

    // While resizing a big control (width/height > 1), its internal landing pads will be displayed as visual cue for the user.
    // If the control is resized smaller during dragging, only the landing pads that are covered ny the mouse position will be highlighted
    checkLandingPadOverlap(resizingControlId, rectContainer, rectResizing) {
        // will only take effect if the resizing rect's height or width is smaller than the container
        // if (rectContainer.width <= rectResizing.width && 
        //     rectContainer.height <= rectResizing.height) {
        //         this.removeAllLandingPadPotentialDrops();
        //         return;
        // }    
        
        let landingPadsDom = this.findLandingPadsByParentControl(resizingControlId);
        //console.log('[DEBUG] checkLandingPadOverlap...' + landingPadsDom.length);
        // check if resizing rect covers me
        landingPadsDom.forEach(landingPad => {
            let rectLandingPad = landingPad.getClientRects()[0];
            let isOverlapped = this.hasOverlap(rectResizing, rectLandingPad);
            if (isOverlapped) {
                landingPad.classList.add('landingPadPotentialDrop');
            }
            else if (landingPad.classList.contains('landingPadPotentialDrop')) {
                landingPad.classList.remove('landingPadPotentialDrop');
            }
        });
    }

    // Maybe no need to call this.
    // Since the landing pad elements are only rendered if there is a resizing element
    removeAllLandingPadPotentialDrops() {
        // TODO: don't search the entire document. Supply the designer root element only
        let landingPadPotDrops = document.getElementsByClassName('landingPadPotentialDrop');
        if (landingPadPotDrops.length > 0) {
            // console.log('[DEBUG] removeAllLandingPadPotentialDrops' + landingPadPotDrops.length);
        }
    
        while (landingPadPotDrops.length > 0) {
            let currPad = landingPadPotDrops[0];
            currPad.classList.remove('landingPadPotentialDrop');
        }
    }

    findLandingPadsByParentControl(controlId) {
        // TODO: don't search the entire document. Supply the designer root element only
        let ret = {};
        let keyQuery = `[parentctrlid="ctrl${controlId}"]`;
        return document.querySelectorAll(keyQuery);
    }

    // bFindall: true to find all; false to return just the first one
    // findControlByClassName(rootElem, strClass) {
    //     if (!rootElem || !strClass) {
    //         return null;
    //     }

    //     return rootElem.getElementsByClassName(strClass);
    // }

    // also works
    hasOverlapComplicated(rect1, rect2) {

        //There are less scenarios for no collision so use this instead of checking for collision
        let noHorzCollision = rect2.right < rect1.left || rect2.left > rect1.right;
        let noVertCollision = rect2.bot < rect1.top || rect2.top > rect1.bottom;

        console.log(`   [DEBUG] NoHorz: ${noHorzCollision}, NoVert: ${noVertCollision}, FINAL: ${noHorzCollision || noVertCollision}`);
        // There is overlap if there is Vertical AND Horizontal collision
        return !noHorzCollision && !noVertCollision;
    }

    // simpler
    hasOverlap(rect1, rect2) {
        // if one rect is on the left side of the other rect
        if (rect2.right < rect1.left || rect2.left > rect1.right) {
            //console.log("   [hasOverlap] No horz overlap");
            return false;
        }

        // if one rect is on top of the other
        if (rect2.bottom < rect1.top || rect2.top > rect1.bottom) {
            //console.log("   [hasOverlap] No vertical overlap");
            return false;
        }

        //console.log("   [hasOverlap] has overlap");
        return true;
    }

    // Edge overlap is not considered overlap
    hasOverlapStrict(rect1, rect2) {
        // if one rect is on the left side of the other rect
        if (rect2.right <= rect1.left || rect2.left >= rect1.right) {
            //console.log("   [hasOverlap] No horz overlap");
            return false;
        }

        // if one rect is on top of the other
        if (rect2.bottom <= rect1.top || rect2.top >= rect1.bottom) {
            //console.log("   [hasOverlap] No vertical overlap");
            return false;
        }

        //console.log("   [hasOverlap] has overlap");
        return true;
    }
    
    // While resizing the control, if it overlaps with other controls,
    // those controls will be highlighted as potential landing spots.
    checkOverlaps(resizingControlId, rectResizing, controlIds) {
        //console.log(`[DEBUG][checkOverlaps][${resizingControlId}][L-R: ${rectResizing.left} - ${rectResizing.right}][T-B: ${rectResizing.top} - ${rectResizing.bottom}]`);
        var foundInvalid = false;
        var overlapsFound = [];
        controlIds.forEach((controlId) => {       
            if (resizingControlId === controlId) {
                return; // continue
            }
            let domControl = this.findControlDomById(controlId);
            if (domControl === null) {
                return;
            }
    
            let rectContainer = domControl.container.getClientRects()[0];
            
            //console.log(`[DEBUG][${controlId}][L-R: ${rectContainer.left} - ${rectContainer.right}][T-B: ${rectContainer.top} - ${rectContainer.bottom}]`);
            let isOverlap = this.hasOverlap(rectResizing, rectContainer);
            if (isOverlap) {
                domControl.container.classList.add('potentialResizeDrop');
                overlapsFound.push(domControl);
                // Check if it's an invalid overalp (non empty control)
                if (!!domControl.container.dataset.controltype || 
                    parseInt(domControl.container.dataset.layoutw) > 1 ||
                    parseInt(domControl.container.dataset.layouth) > 1) {
                    foundInvalid = true;
                }
            }
            else if (domControl.container.classList.contains('potentialResizeDrop')) {    
                domControl.container.classList.remove('potentialResizeDrop');
                domControl.container.classList.remove('potentialResizeDrop-invalid');
            }                    
        } );

        // console.log("Overlaps found: ", overlapsFound.length);
        // If there is an invalid drop target, mark all potential drops as invalid
        if (foundInvalid) {
            overlapsFound.forEach(dom => {
                dom.container.classList.add('potentialResizeDrop-invalid');
            })
        }
        else {
            overlapsFound.forEach(dom => {
                dom.container.classList.remove('potentialResizeDrop-invalid');
            })
        }
    }

    onMouseLeave(event, controlIds) {
        if (this.state.resizingControlId) {
            console.log('onMouseLeave while resizing');
            this.clearAllTemporaryClasses(controlIds);
            this.setState({
                resizingControlId: null,
                // Will be set to the original height of the container at the start of resize operation
                origHeight: null,
                origWidth: null
            });    
        }
    }

    onResizerMouseDown(event, controlId) {
        console.log('mouse down resizer...', controlId, event);
        let domResizing = this.findControlDomById(controlId);
        // Note: setState will cause the entire form and all the controls to rerender
        this.setState({
            resizingControlId: controlId,
            origHeight: domResizing.container.getClientRects()[0].height,
            origWidth: domResizing.container.getClientRects()[0].width,
        });    
    }

    // Revert all class changes done during drag operation for resize
    clearAllTemporaryClasses(controlIds) {
        controlIds.forEach( currCtrlId => {
            let domControl = this.findControlDomById(currCtrlId);
            if (domControl === null) {
                return;
            }
    
            domControl.container.classList.remove('potentialResizeDrop');
            domControl.container.classList.remove('potentialResizeDrop-invalid');
            domControl.container.classList.remove('controlPotentialDrop');
    
            if (currCtrlId === this.state.resizingControlId) {
                domControl.container.classList.remove('resizingControl');
                domControl.content.classList.remove('resizingContent');
                domControl.content.style.height = domControl.container.style.height;
                domControl.content.style.width = domControl.container.style.width;    
            }

            domControl.placeholder.style.height = null;
            domControl.placeholder.style.width = null;
        });
    }

    // For handling resize only
    onMouseUp(event, controlIds) {
        if (!this.state.resizingControlId) {
            this.clearAllTemporaryClasses(controlIds);
            return;
        }
        console.log('mouseup while resizing');

        // Calling setState will re-render all the controls
        // But during re-render, if we manually added some classes to the DOM elements, they will still be there during rerender
        // So we still to manually remove all the temprary class names we added during dragging
        //this.removeAllLandingPadPotentialDrops();

        // if there is an overlap with a nonempty control, do not allow it!
        let formElem = document.getElementById("noobForm");
        let hasInvalidOverlaps = formElem.getElementsByClassName('potentialResizeDrop-invalid').length > 0;
        if (hasInvalidOverlaps) {
            console.log('hasInvalidOverlaps...cancelling resize operation');
            this.clearAllTemporaryClasses(controlIds);
            this.setState({
                resizingControlId: null
            });
            return;
        }

        let newSize = this.calculateNewSize(this.state.resizingControlId);

        this.clearAllTemporaryClasses(controlIds);
        this.setState({
            resizingControlId: null
        });

        // Do this check only after calling clearAllTemporaryClasses() because that is essential regardless if we resize or not
        if (!newSize) {
            return;
        }

        // Fire an action to let the redux store know that a control has been resized
        let resizedControlPojo = this.findControlPojo(this.state.resizingControlId);
        if (resizedControlPojo) {
            resizedControlPojo.w = newSize.w;
            resizedControlPojo.h = newSize.h;   
            this.props.updateLayout([resizedControlPojo]); 
        }
        else {
            // it's an empty control...create and empty control with new dimension
            let controlDom = document.getElementById('ctrl'+this.state.resizingControlId);
            this.props.updateLayout([{
                i: this.state.resizingControlId,
                x: parseInt(controlDom.dataset.layoutx),
                y: parseInt(controlDom.dataset.layouty),
                w: newSize.w,
                h: newSize.h
            }]);
        }
        
    }

    findControlPojo(controlId) {
        if (!this || !this.props || !this.props.controls) {            
            console.log("findControlPojo: props is empty");
            return null;
        }

        let findControl = this.props.controls.find(control => control.i === controlId);
        if (!findControl) {
            console.log("findControlPojo: did not find the control with ID", controlId); // just log it
        }

        return findControl;
    }

    // For resizing
    findPotentialDrops() {
        let retList = [];
        // Edge does not support spread/rest operator on DOM list, so use Array.from
        // retList.push(...document.getElementsByClassName("potentialResizeDrop"));
        // retList.push(...document.getElementsByClassName("landingPadPotentialDrop"));
        retList.push(...Array.from(document.getElementsByClassName("potentialResizeDrop")));
        retList.push(...Array.from(document.getElementsByClassName("landingPadPotentialDrop")));
        return retList;
    }

    calculateNewSize(resizingControlId) {
        // check how many of the controls have the 'potentialResizeDrop' class in their DOM
        if (resizingControlId === null) {
            return null;
        }
        
        console.log('[DEBUG][calculateNewSize]' + resizingControlId);
    
        let resizedControlDom = this.findControlDomById(resizingControlId);
    
        let domControls = this.findPotentialDrops();
        if (!domControls || !resizedControlDom || domControls.length === 0) {
            console.log('[DEBUG][calculateNewSize] Cannot find potential drops. Maybe the control was not resized');
            return null; // means control was not resized
        }
        
        let maxX = 0;
        let maxY = 0;
            
        for (let i = 0; i < domControls.length; i++) {
            let currControl = domControls[i];
            let currX = parseInt(currControl.dataset.layoutx);
            let currY = parseInt(currControl.dataset.layouty);
            if (currX && currX > maxX) {
                maxX = currX;
            }
            if (currY && currY > maxY) {
                maxY = currY;
            }
        };
    
        return {
            // no need to include rowspan. There is a validation that we can only resize (even if it's blank) if control is 1x1
            w: maxX - resizedControlDom.container.dataset.layoutx + 1,
            h: maxY - resizedControlDom.container.dataset.layouty + 1,
        }    
    }
    

    findControlDomById(controlId) {
        let ret = {};
        let keyQuery = `[id="ctrl${controlId}"]`;
        let retEl = document.querySelectorAll(keyQuery);
        if (retEl.length !== 1) {
            return null;
        }
    
        ret.container = retEl[0];
        ret.landingPad = ret.container.firstChild;
        ret.content = ret.landingPad.nextSibling;
        ret.placeholder = ret.content.nextSibling;
        ret.resizer = ret.placeholder.nextSibling;
        
            
        return ret;    
    }

    createEmptyControl(inX, inY, id) {
        // Return a 1x1 control
        return {
            w: 1,
            h: 1,
            i: id,
            x: inX,
            y: inY
        }        
    }

    checkDroppable(controlData, draggedItem, landingPadInfo) {
        if (draggedItem.type == ControlDragTypes.CONTROL) {
            if (landingPadInfo) {
                return this.checkDroppableControlLandingPad(controlData, draggedItem, landingPadInfo);    
            }
            return this.checkDroppableControl(controlData, draggedItem);
        }

        return this.checkDroppableToolItem(controlData, draggedItem) 
    }

    // This will highlight the following:
    // * landing pads that are covered by the control being moved
    // * neighbouring controls covered by the control being moved
    // Return true or false, depending if there is sufficient space
    checkDroppableControlLandingPad(droppedControl, draggedItem, landingPadInfo) {
        // Actually draggedItem and droppedControl are just the same because landing pad is rendered
        //console.log('checkDroppableControlLandingPad', droppedControl, draggedItem, landingPadInfo);
        let retVal = true;

        // [a] For the landing pads, actually just straightup highlight all landing pads that with x>= landingPadInfo.x and same for y
        let landingPadX = landingPadInfo.layoutPos["data-layoutx"]; // already adjusted to include control's x and y position
        let landingPadY = landingPadInfo.layoutPos["data-layouty"];
        // debugger
        let landingPadsAll = this.findLandingPadsByParentControl(droppedControl.i);
        let landingPadsCovered = this.findCoveredLandingPads(landingPadsAll, landingPadX, landingPadY);

        // [b] Find neighbouring empty controls to the right and bottom of the droppedControl
        let controlsCovered = this.findCoveredControls(landingPadX, landingPadY, droppedControl);
        if (controlsCovered.length === 0) {
            // 
            retVal = false;
        }


        // [c] Perform the highlights
        landingPadsAll.forEach(landingPad => {
            if (landingPadsCovered.indexOf(landingPad) < 0) {
                landingPad.classList.remove('landingPadPotentialDrop'); 
                landingPad.classList.remove('potentialResizeDrop-invalid'); 
            }
            else {
                // Mark all landing pads
                if (retVal) {
                    landingPad.classList.remove('potentialResizeDrop-invalid'); 
                    landingPad.classList.add('landingPadPotentialDrop'); 
                }
                else {
                    landingPad.classList.add('potentialResizeDrop-invalid'); 
                }                
            }
        });

        controlsCovered.forEach(control => {
            control.classList.add('controlPotentialDrop'); 
        });

        // [d] Remove those that are no longer valid (highlighted green from previous call)
        // Since this is not a JS Arr, use classic for-loop
        let designerDom = document.getElementById('noobForm');
        let potentialDropsAll = designerDom.getElementsByClassName('controlPotentialDrop');
        this.removePreviousPotentialDrops(potentialDropsAll, controlsCovered);


        return retVal;
    }

    // Neighbour controls that should be highligted while moving a control that overlaps with itself
    findCoveredControls(landingPadX, landingPadY, controlData) {
        let retList = [];
        let deficitW = landingPadX - controlData.x;
        let deficitH = landingPadY - controlData.y;
        let designerDom = document.getElementById('noobForm');

        // debugger
        // Find all controls to the right
        for (let x=0; x < deficitW; x++) {
            for (let y=0; y < controlData.h; y++) {
                let query = designerDom.querySelector(`div[data-layouty="${y + landingPadY}"][data-layoutx="${x + controlData.w + controlData.x}"]`);
                if (!query || !!query.dataset.controltype) {
                    return [];
                }
                retList.push(query);
            }
        }

        // Find all controls to the bottom
        for (let y=0; y < deficitH; y++) {
            for (let x=0; x < controlData.w; x++) {
                let query = designerDom.querySelector(`div[data-layouty="${y + controlData.h + controlData.y}"][data-layoutx="${x + landingPadX}"]`);
                if (!query || !!query.dataset.controltype) {
                    return [];
                }
                retList.push(query);
            }
        }
        return retList;
    }

    // Landing pads that should be highligted while moving a control that overlaps with itself
    findCoveredLandingPads(landingPadsAll, x, y) {
        let retList = [];
        for (let i = 0; i < landingPadsAll.length; i++) {
            let currLandingPadDom = landingPadsAll[i];
            if (currLandingPadDom.dataset.layoutx >= x && currLandingPadDom.dataset.layouty >= y) {
                retList.push(currLandingPadDom);
            }
        }

        return retList;
    }

    checkDroppableControl(controlData, draggedItem) {
        // if dragged to itself, return false immediately.
        // Do not allow dropping to same position. It's pointless and just a waste of processing.
        if (controlData.i === draggedItem.i)  {
            this.clearAllTemporaryClasses([controlData.i])
            //console.log('checkDroppableControl, dragged to itself...return false', controlData);
            return false;
        }

        //console.log('checkDroppableControl', controlData);

        let retVal = true;
        // If dragged to a different control of different dimension, do not allow
        if (draggedItem.i !== controlData.i && !!controlData.ctrlType &&
            (draggedItem.w !== controlData.w || draggedItem.h !== controlData.h)) {
            retVal = false; // We just want to proceed removing the previous potential drops
            console.log('checkDroppableControl: false agad', controlData.i);
        }        

        // if dragged to an empty space, make sure there is enough space
        let potentialDropsNow = retVal ? this.getPotentialDropsForMoving(controlData, draggedItem) : []; 
        retVal = potentialDropsNow.length > 0;

        // [2] Highlight the neighbours green
        potentialDropsNow.forEach(dom => {dom.classList.add('controlPotentialDrop')})

        // [3] Remove those that are no longer valid (highlighted green from previous call)
        // Since this is not a JS Arr, use classic for-loop
        let designerDom = document.getElementById('noobForm');
        let potentialDropsPrevious = designerDom.getElementsByClassName('controlPotentialDrop');
        this.removePreviousPotentialDrops(potentialDropsPrevious, potentialDropsNow);

        return retVal;
    }

    // Callback triggered by the control, to check if it's OK to drop the draggedItem into the controlData
    // Reason to handle highlighting @parent side: multiple cells can be hihglighted for bigger controls (minH or minW > 1)
    // Checks:
    // - Enough free space is available, if the control is bigger than 1x1
    // - Highlights the siblings that will be potential drop targets also
    // Hope this function is not too slow, as this function can be called many times during duration of Drag
    // Return: true or false -- will affect the mouse cursor (handled by react dnd)
    // Other functions: highlight cells green if valid. If invalid, simply returns false.
    // Assumption controlData isOver() === true
    // Design note: We cannot handle highlighting to red for invalids in this function because there is not way for us to 'erase' red highlights here.
    // We don't need to 'erase' green highlights upon mouseUp because the reducer will be called to re-render the control.
    checkDroppableToolItem(controlData, draggedItem) {
        let retVal = !controlData.ctrlType; // If false, we just want to remove the previous highlights
        let minH = draggedItem.minH ? draggedItem.minH : 1;
        let minW = draggedItem.minW ? draggedItem.minW : 1;
                
        // [1] Find the siblings that are covered by minW and minH. If cannot find, means inValid Drop
        // gather first and highlight only when all controls are found
        let potentialDropsNow = retVal ? this.getPotentialDropsForNewItem(controlData, minW, minH) : []; 

        // [2] Highlight the neighbours green
        potentialDropsNow.forEach(dom => {dom.classList.add('controlPotentialDrop')})
        retVal = potentialDropsNow.length > 0;

        // [3] Remove those that are no longer valid (highlighted green from previous call)
        // Since this is not a JS Arr, use classic for-loop
        let designerDom = document.getElementById('noobForm');
        let potentialDropsPrevious = designerDom.getElementsByClassName('controlPotentialDrop');
        this.removePreviousPotentialDrops(potentialDropsPrevious, potentialDropsNow);

        return retVal;
    }

    // For new item, only allow dropping if ALL the cells are empty and unresized
    getPotentialDropsForNewItem(controlData, draggedItemW, draggedItemH) {
        let designerDom = document.getElementById('noobForm');        
        

        // Check first if the controlData already has the exact dimension
        if (controlData.w === draggedItemW && controlData.h === draggedItemH) {
            return [document.getElementById('ctrl'+controlData.i)];
        }

        // Find the siblings that are covered by minW and minH. If cannot find, means inValid Drop
        let potentialDropsNow = []; // gather first and highlight only when all controls are found
        for (let x = draggedItemW - 1; x >= 0; x--) {
            for (let y = draggedItemH - 1; y >= 0; y--) {
                // start with the rightmost and bottom-most; fail faster
                let query = designerDom.querySelector(`div[data-layouty="${y + controlData.y}"][data-layoutx="${x + controlData.x}"]`);       
                if (!query) {
                    return [];
                }

                potentialDropsNow.push(query);
            }
        }
        //console.log('getPotentialDrops', controlData.i, potentialDropsNow);
        return potentialDropsNow;
    }

    // For moving control, it is OK to move the control that overlaps with draggedItem's current coordinates
    getPotentialDropsForMoving(hoveredControlData, draggedItem) {
        let designerDom = document.getElementById('noobForm');        
        
        // Check first if the controlData already has the exact dimension
        if (hoveredControlData.w === draggedItem.w && hoveredControlData.h === draggedItem.h) {
            return [document.getElementById('ctrl'+hoveredControlData.i)];
        }

        // Find the siblings that are covered by minW and minH. If cannot find, means inValid Drop
        let rectDraggedItem = {
            top: draggedItem.y, 
            bottom: draggedItem.y + draggedItem.h, 
            left: draggedItem.x, 
            right: draggedItem.x + draggedItem.w
        };

        let potentialDropsNow = []; // gather first and highlight only when all controls are found
        let foundOverlapWithDraggedItem = false;
        for (let x = draggedItem.w - 1; x >= 0; x--) {
            for (let y = draggedItem.h - 1; y >= 0; y--) {
                // start with the rightmost and bottom-most; fail faster

                // Check if this coordinate is covered by the draggedItem
                let rectCurr = {
                    top: hoveredControlData.y + y,
                    bottom: hoveredControlData.y + y + 1,
                    left: hoveredControlData.x + x,
                    right: hoveredControlData.x + x + 1,
                }

                if (this.hasOverlapStrict(rectCurr, rectDraggedItem)) {
                    if (!foundOverlapWithDraggedItem) {
                        let overlappedDom = document.getElementById('ctrl'+draggedItem.i);
                        potentialDropsNow.push(overlappedDom);
                        foundOverlapWithDraggedItem = true;
                    }
                    continue;
                }                                

                let query = designerDom.querySelector(`div[data-layouty="${y + hoveredControlData.y}"][data-layoutx="${x + hoveredControlData.x}"]`);       
                if (!query || !!query.dataset.controltype) {
                    return [];
                }

                potentialDropsNow.push(query);
            }
        }
        //console.log('getPotentialDrops', controlData.i, potentialDropsNow);
        return potentialDropsNow;
    }

    removePreviousPotentialDrops(potentialDropsPrevious, potentialDropsNow) {
        for (var i = 0; i < potentialDropsPrevious.length; i++) {
            let prev = potentialDropsPrevious[i];
            if (potentialDropsNow.indexOf(prev) >= 0) {
                continue;
            }
            prev.classList.remove('controlPotentialDrop');
        }
    }

    onDropControl(ctrlDest, itemDropped, landingPadPos) {
        
        if (itemDropped.type === 'toolItem') {
            this.handleToolItemDrop(ctrlDest, itemDropped);
        }
        else if (landingPadPos) {
            this.handleControlMoveWithLandingPad(ctrlDest, itemDropped, landingPadPos);
        }
        else {
            this.handleControlMove(ctrlDest, itemDropped);
        }

        // Clear the temp classes of ctrlDest
        this.clearAllTemporaryClasses([ctrlDest.i, itemDropped.i]);
    }

    handleControlMoveWithLandingPad(ctrlDest, itemDropped, landingPadPos) {
        // ctrlDest and itemDropped are expected to be the same
        console.log('handleControlMoveWithLandingPad', ctrlDest, itemDropped, landingPadPos);
        let landingPadX = landingPadPos['data-layoutx'];
        let landingPadY = landingPadPos['data-layouty'];

        let updatedControl = {
            ...ctrlDest,
            x: landingPadX,
            y: landingPadY
        }

        this.props.updateLayout([updatedControl]); 
    }

    handleToolItemDrop(ctrlDest, itemDropped) {
        console.log('handleToolItemDrop', ctrlDest, itemDropped);
        let newDate = new Date();
        // Fire an action to let the redux store know that a control has been added
        this.props.updateLayout([{
            i: ctrlDest.i + newDate.toString(),  // TODO: Generate an ID in reducer
            ctrlType: itemDropped.toolItemTypeName,
            x: ctrlDest.x,
            y: ctrlDest.y,
            w: !!itemDropped.minW ? itemDropped.minW : 1,
            h: !!itemDropped.minH ? itemDropped.minH : 1,
        }]); 
    }

    handleControlMove(ctrlDest, itemDropped) {
        console.log('handleControlDrop', ctrlDest, itemDropped);
        // Fire an action to let the redux store know that a control has been added
        let updatedControls = [];
        let itemDroppedNew = {
            ...itemDropped,
            x: ctrlDest.x,
            y: ctrlDest.y,
        };
        updatedControls.push(itemDroppedNew);

        if (!!ctrlDest.ctrlType) {
            let ctrlDestNew = {
                ...ctrlDest,
                x: itemDropped.x,
                y: itemDropped.y
            }
            updatedControls.push(ctrlDestNew);
        }

        this.props.updateLayout(updatedControls); 
    }

    renderControl(control, containerWidth, numCols) {
        return <NoobControl 
                key={'ctrl'+control.i} 
                controlData={{...control}}
                parentDropCallback={this.onDropControl}
                resizerMouseDown={this.onResizerMouseDown}
                resizingControlId={this.state.resizingControlId}
                parentCheckDroppable={this.checkDroppable}
                isSelected={false}
                containerWidth={containerWidth}
                numCols={numCols}/>
    }

    // Returns an array containing the flat coordinates of the specified control
    // E.g. Control is x:0, y:0, w:3, h:2, layoutWidth:10
    // return: [0,   1,  2,         --> first row
    //          10, 11, 12]         --> second row
    getFills(control, layoutWidth) {
        let retList = [];
        for (var iRow = 0; iRow < control.h; iRow++) {
            for (var iCol = 0; iCol < control.w; iCol++) {
                
                let adjustedX = iCol + control.x; 
                let adjustedY = iRow + control.y;
                retList.push(adjustedY * layoutWidth + adjustedX);
            }
        }

        return retList;
    }


    renderControlsWithLayout(layoutData, controls, containerWidth) {
        let retList = [];  
        let fillMap = [];
        for (var iRow = 0; iRow < layoutData.rows; iRow++) {
            for (var iCol = 0; iCol < layoutData.columns; iCol++) {            
                let flatCoord = iRow * layoutData.columns + iCol;
                // if coordinate already filled, skip
                if (fillMap.find(n => n === flatCoord)) {
                    continue;
                }

                // try to find if there is a control associated
                // otherwise just render an empty control
                let findControl = controls.find(ctrl => ctrl.x == iCol && ctrl.y == iRow );
                if (!findControl) {
                    let emptyControlPojo = this.createEmptyControl(iCol, iRow, flatCoord); // plain old JS obj
                    let emptyControlJsx = this.renderControl(emptyControlPojo, containerWidth, layoutData.columns);
                    retList.push({
                        id: emptyControlPojo.i,
                        jsx: emptyControlJsx
                    });                    
                }
                else {
                    //retList.push(this.renderControl(findControl));
                    console.log('renderControlsWithLayout', findControl.i, findControl.x, findControl.y, findControl.w, findControl.h);
                    let controlJsx = this.renderControl(findControl, containerWidth, layoutData.columns);
                    retList.push({
                        id: findControl.i,
                        jsx: controlJsx
                    });
                    let newFills = this.getFills(findControl, layoutData.columns)
                    fillMap = fillMap.concat(newFills);
                }
            }
        }

        return retList;
    }

    renderControlsAsSingleCol(layoutData, controls, containerWidth) {
        let retList = [];
        // We still need the for-loops so that the controls are sorted from top-left to bottom right
        for (var iRow = 0; iRow < layoutData.rows; iRow++) {
            for (var iCol = 0; iCol < layoutData.columns; iCol++) {            
                let flatCoord = iRow * layoutData.columns + iCol;
                // try to find if there is a control associated
                // otherwise just render an empty control
                let findControl = controls.find(ctrl => ctrl.x == iCol && ctrl.y == iRow );
                if (!findControl) {
                    continue;
                }
                else {
                    // pass in null as the containerWidth, to indicate that we don't want to display as grid
                    let controlJsx = this.renderControl(findControl, containerWidth, 1);
                    retList.push({
                        id: findControl.i,
                        jsx: controlJsx
                    });
                }
            }
        }

        return retList;
    }

    renderControls(layoutData, controls, containerWidth) {
        // debugger
        // For retlist: we don't use object (KV pair) beacause we need to render them according to the order we pushed them to the list.
        // Retrieving the keys or values via Object.keys()/Object.values() do not come in the order that they were set
        if (containerWidth > WIDTH_LARGE) {
            return this.renderControlsWithLayout(layoutData, controls, containerWidth);
        }
        else {
            return this.renderControlsAsSingleCol(layoutData, controls, containerWidth);
        }
    }

    render() {
        console.log('render NoobForm...', this.props.selectedPage);
        let {controls, layoutData} = this.props;
        let controlsList = this.renderControls(layoutData, controls, this.props.containerWidth);
        let controlIds = controlsList.map(c => c.id);
        let controlsJsx = controlsList.map(c => c.jsx);
    
        var divStyle = this.props.containerWidth > WIDTH_LARGE ?
        {'gridTemplateColumns': `repeat(${layoutData.columns}, 1fr)`} : 
        {'gridTemplateColumns': '1fr'};

        let classNames = "noobForm ";
        if (this.props.selectedPage) {
            classNames += "page-selected";
        }
    
        return (
        <div id="noobForm"
            className={classNames}
            onMouseLeave={(e) => {this.onMouseLeave(e, controlIds)}}

            onMouseUp={(e) => {this.onMouseUp(e, controlIds)}}
            onTouchEnd={(e) => {this.onMouseUp(e, controlIds)}}

            onMouseMove={(e) => {this.onMouseMove(e, controlIds)}}
            onTouchMove={(e) => {this.onMouseMove(e, controlIds)}}

            //onMouseDown={(e) => {console.log('[noobForm] MouseDown')}}
            style={divStyle}>
            {controlsJsx}            
        </div>    
        );    
    }
}

const mapStateToProps = (state) => {
    return {
        selectedPage: state.designer.pageSelected,
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({ updateLayout }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(NoobForm);