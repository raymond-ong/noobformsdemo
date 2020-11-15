import React, { Fragment, useRef, useState, useEffect } from 'react';
import './lineChart.css';
import './rechartsCommon.css';
import noobControlHoc from '../hoc/noobControlsHoc';
import {LineChart as RechartLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer} from 'recharts';
import {getUniqueValues} from '../helper/chartHelper';

const sampleData = [
  {name: 'Category A', Series1: 5.5, },
  {name: 'Category B', Series1: 3.5, },
  {name: 'Category C', Series1: 9.8, },
  {name: 'Category D', Series1: 7.7, },
];

const CustomizedLabel = (props) => {
  const {x, y, stroke, value} = props;
		
  return <text x={x} y={y} dy={-10} fill={stroke} fontSize={14} textAnchor="middle">{value}</text>
}

const CustomizedAxisTick = (props) => {
  const {x, y, stroke, payload, category} = props;
  let textVal = payload.value;
  
  if (category === 'Day') {
    let dateParsed = Date.parse(payload.value);
    if (!!dateParsed) {
      let dateObj = new Date(dateParsed);      
      if (!!dateObj) {
        textVal = dateObj.toLocaleDateString();
      }
    }
  }
		
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-35)">{textVal}</text>
    </g>
  );
}

// For now, just support 1 series
// import this class if not in design mode
export const LineChartBase = (props) => {

  const reformatLineChartData = (apiData) => {
    // Input:
    // {Day: "2020-01-01", Alarm Type: "Out of Spec", value: 50}
    // {Day: "2020-01-01", Alarm Type: "Normal", value: 10}
    // Output:
    // {Day: "2020-01-01", Out of Spec: 50, Normal: 10}

    let retList = [];
    let categories = props.data.dataProps.categories; // e.g. Day
    let seriesName = props.data.dataProps.seriesName; // e.g. Alarm Type

    for (let i = 0; i < apiData.length; i++) {
      let currData = apiData[i];
      let currCategoryVal = currData[categories];
      let currSeriesName = currData[seriesName];
      let currSeriesVal = currData.value;
      let findRetList = retList.find(r => r[categories] === currCategoryVal);
      if (!findRetList) {
        findRetList = {
          [categories]: currCategoryVal
        }
        retList.push(findRetList);
      }

      findRetList[currSeriesName] = currSeriesVal;
    }

    return retList;
  }

  // Recharts has a bug during printing / saving to PDF
  // Do not use the ResponsiveContainer during printing
  const renderLineChartContainer = () => {
    if (props.reportMode) {
      return renderLineChartContents();
    }
    else {
      return <ResponsiveContainer width={"100%"} height="100%">
        {renderLineChartContents()}
      </ResponsiveContainer>
    }
  }

  const renderLineChartContents = () => {
    // the height and width are just overridden when placed inside a ReponsiveContainer
    return (
      <RechartLineChart data={dataToUse}
      margin={{top: 20, right: 30, left: 0, bottom: 25}}
      height={myState.height}
      width={myState.width}
      >

        <CartesianGrid strokeDasharray="3 3"/>
        <XAxis dataKey={category} height={60} tick={<CustomizedAxisTick category={category}/>} padding={{ left: 50 }} interval={0}/>
        <YAxis unit={props.data.unit}/>
        <Tooltip/>
        <Legend />
        <Line 
          type="monotone" 
          dataKey={seriesName}
          stroke="blue" 
          label={<CustomizedLabel stroke="blue"/>}
          dot={{ stroke: 'blue', strokeWidth: 10 }}
          animationDuration={500}/>
      </RechartLineChart>
    );
  }

  const chartContainerEl = useRef();
  const [myState, setMyState] = useState({
    height: 0,
    width: 0
  });

useEffect(() => {
    console.log('[DEBUG] useEffect gauge', chartContainerEl);
    if (!chartContainerEl || !chartContainerEl.current || !chartContainerEl.current.getClientRects()) {
      return;
    }
    let rect = chartContainerEl.current.getClientRects()[0]
    if (!rect) {
        return;
    }
    setMyState({
      height: rect.height,
      width: rect.width
    })
    
}, []);
  
  let isAnimationActive = props.designMode ? true : false;  
  let seriesName = props.designMode ? "Series1": props.data.dataProps.seriesName;
  let category = props.designMode ? "name": props.data.dataProps.categories;
  let dataToUse = [];
  if (props.designMode) {
    dataToUse = sampleData;
  }
  else if (!!props.apiData) {
    debugger
    dataToUse = reformatLineChartData(props.apiData.data)
    let allUniqeSeriesVals = getUniqueValues(props.apiData.data, props.data.dataProps.seriesName);
    if (Array.isArray(allUniqeSeriesVals) && allUniqeSeriesVals.length>0) {
      seriesName = allUniqeSeriesVals[0]; // for POC, we assume only 1 series
    }
  }

  debugger
  console.log('linechart render', dataToUse);

  let classNames = 'reChartContainer '; 
  if (props.selected) {
    classNames += 'ctrl-selected';
  }

  return (<div className={classNames} ref={chartContainerEl}>
    <div className="controlLabel">{props.data.label}</div>    
      {renderLineChartContainer()} 
    </div>
  );
}

// import this if Design Mode
export default noobControlHoc(LineChartBase);


// For Properties Panel
export const lineProps = [
  {
    name: 'dataProps', 
    propType: 'section',
  },
  {
    name: 'datasetId', 
    propType: 'number',
  },
  {
    name: 'requestType', 
    propType: 'metadata',
    metadataField: 'requestTypes',
    metadataPropType: 'dropdown'
  },
  {
    name: 'categories', 
    propType: 'metadata',
    metadataField: 'dimensions',
    metadataPropType: 'treeDropdown'
  },
  {
    name: 'seriesName', 
    propType: 'metadata',
    metadataField: 'dimensions',
    metadataPropType: 'treeDropdown'
  },
  {
    name: 'filterName', 
    propType: 'metadata',
    metadataField: 'dimensions',
    metadataPropType: 'treeDropdown'
  },

]