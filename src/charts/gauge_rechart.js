import React, {useRef, useState, useEffect} from 'react';
import { Sector, Cell, PieChart, Pie, ResponsiveContainer, Legend } from 'recharts';
import noobControlHoc from '../hoc/noobControlsHoc';
import './rechartsCommon.css';

const GaugeChart = (props) => {
    console.log('[DEBUG] render GaugeChart', props);    
    const width = parseInt(props.maxWidth)? parseInt(props.maxWidth) : 300;
    const chartValue = props.apiData && Array.isArray(props.apiData.data) && props.apiData.data.length > 0 ? 
                        parseFloat(props.apiData.data[0].value) : 0;
    let unit = "%";
    const colorData = [{
            value: 20, // Meaning span is 0 to 20
            color: '#e71837' // 'red' pastel
        }, {
            value: 60, // span 20 to 80
            color: '#fce903' // 'gold pastel'
        }, {
            value: 20, // span 80 to 100
            color: '#106b21' // 'green' pastel
        }
    ];

    const activeSectorIndex = colorData.map((cur, index, arr) => {
        const curMax = [...arr]
            .splice(0, index + 1)
            .reduce((a, b) => ({ value: a.value + b.value }))
            .value;
        return (chartValue > (curMax - cur.value)) && (chartValue <= curMax);
    })
    .findIndex(cur => cur);

    const sumValues = colorData
        .map(cur => cur.value)
        .reduce((a, b) => a + b);

    const arrowData = [
        { value: chartValue },
        { value: 0 },
        { value: sumValues - chartValue }
    ];

    const pieProps = {
        startAngle: 180,
        endAngle: 0,
        cx: '50%',
        //cy: width / 2
        cy: props.data.label && props.data.label.length > 0 ? '55%' : '65%'
        //cy: '50%'
    };

    const pieRadius = {
        // innerRadius: (width / 2) * 0.35,
        // outerRadius: (width / 2) * 0.4
        // innerRadius: (width / 4) + width / 16 - 10 - width / 36,
        // outerRadius: (width / 4) + width / 16 - 10
        innerRadius: '90%',
        outerRadius: '100%'
    };

    const Arrow = ({ cx, cy, midAngle, outerRadius }) => { //eslint-disable-line react/no-multi-comp
        const RADIAN = Math.PI / 180;
        const sin = Math.sin(-RADIAN * midAngle);
        const cos = Math.cos(-RADIAN * midAngle);
        // const mx = cx + (outerRadius + width * 0.03) * cos;
        // const my = cy + (outerRadius + width * 0.03) * sin;
        const mx = cx + (outerRadius) * cos;
        const my = cy + (outerRadius) * sin;
        return (
            <g>
                <circle cx={cx} cy={cy} r={width * 0.03} fill="#666" stroke="none"/>
                <path d={`M${cx},${cy}L${mx},${my}`} strokeWidth="6" stroke="#666" fill="none" strokeLinecap="round"/>
                <text x={cx} y={cy + width/8 } textAnchor="middle" fontSize={width / 13}>{chartValue}{unit}</text>
            </g>
        );
    };

    const ActiveSectorMark = ({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill }) => { //eslint-disable-line react/no-multi-comp
        return (
            <g>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius * 1.0}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                />
            </g>
        );
    };

    // Draws the "plate" part of the page (the semicircle part)
    const renderGaugePlate = () => {
        return <Pie
        activeIndex={activeSectorIndex}
        activeShape={ActiveSectorMark}
        data={colorData}
        fill="#8884d8"
        isAnimationActive={false}
        dataKey="value"
        { ...pieRadius }
        { ...pieProps }
    >
        {
            colorData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colorData[index].color} />
            ))
        }
        </Pie>
    }

    // Draws the needle of the gauge
    const renderGaugeNeedle = () => {
        return <Pie
            stroke="none"
            activeIndex={1}
            activeShape={ Arrow }
            data={ arrowData }
            outerRadius={ pieRadius.outerRadius }
            fill="none"
            dataKey="value"
            isAnimationActive={false}
            { ...pieProps }
        />
    }

    // Recharts has a bug during printing / saving to PDF
    // Do not use the ResponsiveContainer during printing
    const renderGaugeChartArea = () => {
        if (props.reportMode) {
            return <PieChart margin={{top: 0, right: 0, left: 0, bottom: 0}}
                height={myState.height}
                width={myState.width}
            >
                    {renderGaugePlate()}
                    {renderGaugeNeedle()}
                </PieChart>;
        }
        else {
            return <ResponsiveContainer  width="100%" height="100%" >
                <PieChart margin={{top: 0, right: 0, left: 0, bottom: 0}}
                >
                    {renderGaugePlate()}
                    {renderGaugeNeedle()}
                </PieChart>
            </ResponsiveContainer>
        }
    }

    let classNames = 'reChartContainer '; 
    if (props.selected) {
      classNames += 'ctrl-selected';
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

    return (<div className={classNames} ref={chartContainerEl}>
        {props.data.label && props.data.label.length > 0 && <div className="controlLabel">{props.data.label}</div>}
        {renderGaugeChartArea()}
    </div>
    );
};

export default noobControlHoc(GaugeChart);


// Properties Panel Portion
export const gaugeProps = [
    {
      name: 'dataProps', 
      propType: 'section',
    },
    {
      name: 'datasetId', 
      propType: 'number',
      toolTip: 'Put the same datasetId for all controls that are linked. When a filter is applied in one control, other linked controls will also be filtered.'
    },
    {
      name: 'requestType', 
      propType: 'metadata',
      metadataField: 'requestTypes',
      metadataPropType: 'dropdown'
    },
    {
      name: 'groupings', 
      propType: 'metadata',
      metadataField: 'dimensions',
      metadataPropType: 'treeDropdown',
      multiple: true
    },
    {
        name: 'filtersList', 
        propType: 'dynamicFilter',
        metadataField: 'dimensions', // Infer metadata field if it is a dynamicFilter
        metadataPropType: 'treeDropdown',
        multiple: true,
        toolTip: "Select one or more filters by clicking the Add Parameter button"
      },
    ];