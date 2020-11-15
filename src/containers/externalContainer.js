import React from 'react';
import noobControlHoc from '../hoc/noobControlsHoc';
import './externalContainer.css';

// Make this a prop, if need to create another external page
const externalPageDefault = "http://localhost:3000/IsaeExecSummary/ExecutiveSummary_r1.html";

export const ExternalContainerBase = (props) => {

    const getContent = () => {
        return <iframe className="externalContainerContent"
            src={props && props.data && props.data.url ? props.data.url : externalPageDefault}
        />;
    }

    let classNames = 'externalContainer';
    if (props.selected === true) {
        classNames += ' ctrl-selected'
    }
      
    return <div className={classNames}>
        {getContent()}
        </div>
}

export default noobControlHoc(ExternalContainerBase);