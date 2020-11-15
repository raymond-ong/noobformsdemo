import React, {useState, useContext} from 'react';
import '../controls/datepicker.css';
import noobControlHoc from '../hoc/noobControlsHoc';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Label, Dropdown} from "semantic-ui-react";
import { FormContext } from "./Form";
import { RHFInput } from "react-hook-form-input";

export const dateRangeDropdownOptions = [
    { key: 'Latest value only', text: 'Latest value only', value: 'Latest value only', disabled: true},
    { key: 'Last 1 day', text: 'Last 1 day', value: 'Last 1 day', disabled: true },
    { key: 'Last 7 days', text: 'Last 7 days', value: 'Last 7 days', disabled: true },
    { key: 'Last 30 days', text: 'Last 30 days', value: 'Last 30 days', disabled: true },
    { key: 'Custom Range', text: 'Custom Range', value: 'CustomRange' },
];

const FormDateRange = ({ name, label, initialValue, alwaysCustomRange, showMonthYearPicker, dateFormat,...rest }) => {
    //const [startDate, setStartDate] = useState(new Date());
    // No need to set initial values
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [disableDatePicker, setDisableDatePicker] = useState(!alwaysCustomRange);
    const { register, setValue, unregister, errors } = useContext(FormContext);
    let effectiveFormat = dateFormat ? dateFormat : "yyyy / MMM / dd";

    function handleChangeStart([date, evt]) {
        setStartDate(date);
        return {
            value: date
        }
    }

    function handleChangeEnd([date, evt]) {
        setEndDate(date);
        return {
            value: date
        }
    }

    function handleChangeValue([, props]) {
        if (props.value === 'CustomRange') {
            setDisableDatePicker(false);
        }
        else {
            setStartDate(null);
            setEndDate(null);
        }

        return { value: props.value};
    }

    const renderDropdown = () => {
        if (alwaysCustomRange) {
            return <div style={{display: "none"}}></div>
        }

        return <Dropdown 
            fluid                 
            selection   
            options={dateRangeDropdownOptions} 
            defaultValue={initialValue ? initialValue : dateRangeDropdownOptions[0].value}         
        />;
    }

    return <>
                {label && <div className="dateLabel">{label}</div>}

                <RHFInput
                    as={renderDropdown()}

                name={name+".value"}
                //value={name}
                //type="daterange"
                register={register}
                unregister={unregister}
                setValue={setValue}
                onChangeEvent={handleChangeValue}
                />
                
                <div className="dateLabel">Start:</div>
                <div className="datepickerWrapper">
                <RHFInput
                    as={<DatePicker
                    selected={startDate}
                    //onChange={date => setStartDate(date)}
                    //onChange={args => {debugger}}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    disabled={disableDatePicker}        
                    showMonthYearPicker={showMonthYearPicker}            
                    dateFormat={effectiveFormat}
                    />}

                name={name+".start"}
                //value={name}
                //type="daterange"
                register={register}
                unregister={unregister}
                setValue={setValue}
                onChangeEvent={handleChangeStart}
                />
            </div>
            <div className="dateLabel">End:</div>
            <div className="datepickerWrapper datepickerWrapperEnd">
            <RHFInput
            as={
                <DatePicker
                selected={endDate}
                //onChange={date => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                disabled={disableDatePicker}
                showMonthYearPicker={showMonthYearPicker}            
                dateFormat={effectiveFormat}
                />}

            name={name + ".end"}
            //value={name}
            //type="daterange"
            register={register}
            unregister={unregister}
            setValue={setValue}
            onChangeEvent={handleChangeEnd}

            />
        </div>
        </>
}
export default FormDateRange
