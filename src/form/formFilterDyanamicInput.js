import React, {useState, useContext, useEffect} from 'react';
import { FormContext, FormTreeDropDown, Text} from "./Form";
import TreeSelect, { SHOW_PARENT } from 'rc-tree-select';
import {Button, Popup, Form as SemanticForm, Input} from "semantic-ui-react";
import './formFilterDyanamicInput.css';
import 'rc-tree-select/assets/index.css';
import './FormTreeDropDown.css';
import {uuidv4} from '../helper/util';
import {ShowMessage, NotifType} from '../helper/notification';

// Allows the user to dynamically add filters by clicking "Add" button.
// Design: Basically just reuse existing FormComponents. We just manage them here.

// Similar to FormFilterInput except that the first filtered field is a dropdown instead of a textbox
// And we also remove the Condition combobox. Assume that the condition is always "Equals"

const FormFilterDynamicInput = ({ name, label, initialValue, toolTip, filterFieldOptions, initialFilters, parentId, ...rest }) => {
    const { register, setValue, unregister, errors } = useContext(FormContext);
    const [filters, setFilters] = useState(initialFilters || {});
    const [currParentId, setCurrParentId] = useState(parentId);

    function handleChangeValue([, props]) {
        return { value: props.value};
    }

    const addParameter = () => {
        setFilters({
            ...filters,
            [uuidv4()]: {
                filterName: null,
                filterValue: null
            }
        });
    }

    const renderFilters = () => {
        //console.log("renderFilters", filters, 'initialFilters:', initialFilters);
        // filterToUse+parentId: bug fix for issue where the fields are blank when selecting one gauge to another gauge
        // cause: useState() is only called/effective in the first render. 
        // filters state is still holding the old value. Current latest value is in initialFilters
        // But we also cannot use initialFilters all the time, because the UI will not update if "Add Filter" is clicked
        // Fix: use initialFilters if it is the first render. Use filters in the succedding renders.
        let filterToUse = currParentId === parentId ? filters : initialFilters;
        let retList = [];
        for (let prop in filterToUse) {
            retList.push(<div className="dynamicFilterRow" key={`dynamicFilterRow-${prop}`}>
            <FormTreeDropDown
                name={`${name}.${prop}.filterName`}
                treeData={filterFieldOptions}
                isRequired={false}
            />
            <Text small
                name={`${name}.${prop}.filterValue`}
            />
            <i className="ui icon trash alternate btnImageFormCoordDelete" onClick={e => ShowMessage("Sorry, not yet implemented!", NotifType.danger)}/>
        </div>);
        }

        return retList;
    }

    //console.log("FormFilterDynamicInput, render", initialFilters);

    useEffect(() => {
        setFilters(initialFilters || {});
        setCurrParentId(parentId);
    }, [initialFilters, parentId]);

    return <SemanticForm.Field>
        {label && <label>
                    <span key={'label-'+name}>{label}</span>
                    &nbsp;
                    {!!toolTip && <Popup 
                        inverted
                        basic
                        size='tiny' style={{opacity: '0.8'}} 
                        content={toolTip}
                        trigger={<div style={{display: 'inline-block', color: 'gray'}}>
                        <i className="ui icon info circle"/>
                        </div>} />
                    }
            </label>}            
        <div><Button type="button" size="tiny" primary onClick={addParameter}>Add Parameter</Button></div>
        <div className="dynamicFiltersContainer">
            {renderFilters()}
        </div>
    </SemanticForm.Field>
}
export default FormFilterDynamicInput;