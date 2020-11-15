import React from 'react';
import './common.css';
import './label.css';
import { Input } from 'semantic-ui-react'
import noobControlHoc from '../hoc/noobControlsHoc';


const Label = (props) => {
    console.log('textbox render', props.data.label);
    let classNames = 'ctrlLabel ctrlLabel-report';
    if (props.selected === true) {
        classNames += ' ctrl-selected'
    }

    let labelStyles = {height: '100%'};
    if (!!props.data.color) {
        labelStyles.color = props.data.color;
    }
    if (!!props.data.backgroundColor) {
        labelStyles.backgroundColor = props.data.backgroundColor;
    }
    if (!!props.data.fontSize) {
        labelStyles.fontSize = props.data.fontSize + 'px';
    }
    if(!!props.data.linkedPage) {
        labelStyles.cursor = 'pointer';
    }
    if(!!props.data.alignment) {
        labelStyles.justifyContent = props.data.alignment;
    }
    // For the data
    let labelToShow;
    if (props.pageApiData && props.data.apiFieldName) {
        labelToShow = props.pageApiData[props.data.apiFieldName];
    }
    else {
        labelToShow = props.data.label;
    }

    const handleClick = () => {
        if (!props.data.linkedPage || !props.data.handleLinkClick) {
            return;
        }

        props.data.handleLinkClick(props);
    }

    return <div className={classNames} style={labelStyles} onClick={handleClick}>
        {props.data.icon && <span><i className={`ui icon ${props.data.icon}`} style={{paddingLeft: '5px'}}/></span> }
        <span style={{marginLeft: '5px'}}>{labelToShow}</span>
    </div>
}
export default noobControlHoc(Label);


export const labelProps = [
    {
        // label prop: no need to include if no need to customize. Will automatically title-ize the 'name'
        name: 'icon', 
        propType: 'icon',
    },
    {
        name: 'color', 
        propType: 'color',
    },
    {
        name: 'backgroundColor', 
        propType: 'color',
    },
    {
        name: 'fontSize', 
        propType: 'number',
        toolTip: 'in pixels unit'
    },
    {
        name: 'linkedPage', 
        propType: 'pageLinks',
    },
    {
        name: 'alignment', 
        propType: 'alignment',
        toolTip: 'Specify CSS justify-content value, e.g. left, center'
    },
]