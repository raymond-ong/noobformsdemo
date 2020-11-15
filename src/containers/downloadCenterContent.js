import React, {useState} from 'react';
import { useDispatch } from 'react-redux';
import Form, {FormDateRange} from '../form/Form';
import './downloadCenterContent.css'
import { Segment, Label, Button } from 'semantic-ui-react';
import FormDropDown from '../form/FormDropDown';
import {requestDownloadReport} from '../actions';
import {fetchPageDataSync, fetchPageDataAsync} from '../api/pageApiManager';
import {findExecSummaryRecords} from '../api/ExecutiveSummaryLogic';
import ShowMessage, {NotifType} from '../helper/notification';
import MyEditor from '../components/MyEditor';

// Called to set the initial values
const setPdfFormValues = (setValueFunc, inputObj) => {
    // Set the Analysis Period to Custom Range
    setValueFunc("downloadCentreAnalysisPeriod", "CustomRange");
}

// TODO: put this inside a settings config
const EXEC_SUMMARY_API = "https://0kwuefbg37.execute-api.ap-south-1.amazonaws.com/Initial/execsummary";

// TODO: Create a Report Designer component.
// The dropdown options will be the Report Hierarchy designed by the user
const downloadOptions = [
    { key: 'ExecSummary', text: 'APR Executive Summary', value: 'ExecSummary'},
    { key: 'Full APR Report', text: 'Full APR Report', value: 'Full APR Report',  disabled: true },
];

const formatDate = (date) => {
    return `${date.getFullYear()}-${date.getMonth()+1}`;
}

const constructReportTitle = (execReport) => {
    if (!execReport) {
        return "Report.pdf";
    }

    let start = new Date(execReport.aprStart);
    let end = new Date(execReport.aprEnd);

    return `Report_${formatDate(start)}_${formatDate(end)}.pdf`;
}


const DownloadCenterContent = () => {

    const downloadExecReport = async (execReport) => {
        let response = await dispatch(requestDownloadReport({
            uuid: execReport.uuid,
            start: execReport.aprStart,
            end: execReport.aprEnd
        }));
        const url = window.URL.createObjectURL(new Blob([response.data], {type: "application/octet-stream"}));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${constructReportTitle(execReport)}`); //or any other extension
        document.body.appendChild(link);
        link.click();
    }

    const onSubmitDownloadReport = (args) => {
        console.log('onSubmitDownloadReport', args);
        // Disable the download button while fetching the report
        setDownloading(true);
        setDownloadProgress("Fetching Exec Summaries");

        // Get the Exec Summary API Data from the server first
        fetchPageDataAsync(EXEC_SUMMARY_API)
        .catch(error => {
            setDownloading(false);
            setDownloadProgress("Download Report");    
        })
        .then(async apiResponse => {
            // Determine the Exec Reports to print
            let execReports = findExecSummaryRecords(apiResponse, args);
            if (execReports.length === 0) {
                ShowMessage("Did not find matching Executive Summary Record", NotifType.warning, "Please try another Analysis Period")
            }
            // testing only, multiple pages
            //execReports = execReports.concat(execReports);
            for (let i = 0; i < execReports.length; i++) {
                setDownloadProgress(`Downloading Report ${i+1} of ${execReports.length}`);   
                await downloadExecReport(execReports[i]);
            }
            debugger
            setDownloading(false);
            setDownloadProgress("Download Report");
        });

        

        // For each exec report, send the request to the pdf service
        // dispatch(requestDownloadReport(args.analysisPeriod)).then(response => {
        //     debugger
        //     const url = window.URL.createObjectURL(new Blob([response.data], {type: "application/octet-stream"}));
        //     const link = document.createElement('a');
        //     link.href = url;
        //     link.setAttribute('download', 'file.pdf'); //or any other extension
        //     document.body.appendChild(link);
        //     link.click();

        //     setDownloading(false);
        // });
    }

    const dispatch = useDispatch();
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState("Download Report");

    //let buttonTitle = downloading ? "Downloading Report. Please wait..." : "Download Report";

    return <div className="downloadCenterContent">
        <Segment>
            <Form 
                setControlValues={setPdfFormValues}
                onSubmit={onSubmitDownloadReport}
                // action="http://localhost:5000/createpdf"
                // method="post"
            >
                <div className="segmentTitle">Request PDF Report</div>
                <Label tag size="large" color="brown">Step 1:&nbsp;&nbsp;&nbsp;Enter the Analysis Period</Label>
                <div className="downloadCenterFieldContainer">                    
                    <FormDateRange alwaysCustomRange key="downloadCentreAnalysisPeriod" name="analysisPeriod" label={null} showMonthYearPicker dateFormat="yyyy / MMM"/>
                </div>
                
                <Label tag size="large" color="brown">Step 2:&nbsp;&nbsp;&nbsp;Select the APR Download Type</Label>
                <div className="downloadCenterFieldContainer">
                    <div></div>
                    <FormDropDown key={'downloadCenterPdfOptions'}
                        name={'downloadCenterPdfOptions'}
                        label=""
                        options={downloadOptions}
                        size="small"
                        //defaultValue={"ExecSummary"} // does not work...maybe need to bind to a state value, and call setState during componentWillXXX
                    />
                </div>

                <Label tag size="large" color="brown">Step 3:&nbsp;&nbsp;&nbsp;Download Report</Label>
                <div className="downloadCenterFieldContainer">                    
                    <div></div>
                    <Button primary disabled={downloading}>{downloadProgress}</Button>
                </div>

            </Form>
        </Segment>
        {/* <MyEditor/> */}
    </div>
}

export default DownloadCenterContent;