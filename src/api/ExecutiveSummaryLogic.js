// This file contains the logic needed for filtering and slicing the data from rest api
// Ideally, no need to implement such logic. This logic must be implemented @ the server side (API server)
// -> In the future, should enforce this!
// But because this logic was not implemented @ server side, we implement it here.
import {createMonthDate} from '../helper/util';

const bogusDataUuids = ['136a5d53-e9a8-4d29-a575-b90489df9f74']

// cleanApiDataList is already sorted in ascending order
const findClosestStartDate = (refDate, cleanApiDataList) => {
    for (let i = 0; i < cleanApiDataList.length; i++) {
        let currApiData = cleanApiDataList[i];
        let currApiStart = createMonthDate(currApiData.aprStart);
        if (!!currApiStart && currApiStart >= refDate) {
            return currApiData;
        }
    }
}

export const findExecSummaryRecords = (apiData, downloadParams) => {
    
    if (!apiData || !apiData.data || !downloadParams) {
        return null;
    }
    
    let analysisPeriodFilter = downloadParams.analysisPeriod;
    if (!analysisPeriodFilter) {
        return null;
    }

    // temp: remove bogus data from apiData
    let cleanApiDataList = apiData.data.filter(a => !bogusDataUuids.includes(a.uuid));
    cleanApiDataList.sort((a, b) => {
        let dateA = new Date(a.aprStart);
        let dateB = new Date(a.aprEnd);

        return dateA > dateB;
    })

    debugger
    let retList = [];
    let currAnalysisDate = createMonthDate(analysisPeriodFilter.start);
    let analysisEndDate = createMonthDate(analysisPeriodFilter.end);
    if (!currAnalysisDate || !analysisEndDate) {
        return null;
    }

    while(true) {
        debugger
        // Find the closest start date from API 
        // If cannot find, end this loop
        let closestApiDataStart = findClosestStartDate(currAnalysisDate, cleanApiDataList);
        if (!closestApiDataStart) {
            break;
        }

        let closestApiDataEndDate = createMonthDate(closestApiDataStart.aprEnd);
        if (closestApiDataEndDate > analysisEndDate) {
            // Remove the current closest from the array and search again.
            let index = cleanApiDataList.findIndex(a=>a.uuid === closestApiDataStart.uuid);
            cleanApiDataList.splice(index, 1);
            continue;
        }

        retList.push(closestApiDataStart);
        currAnalysisDate = closestApiDataEndDate;

        // Remove used records too
        let index = cleanApiDataList.findIndex(a=>a.uuid === closestApiDataStart.uuid);
        cleanApiDataList.splice(index, 1);
    }

    return retList;
}

const findRecordWithLatestEndDate = (data) => {
    if (!Array.isArray(data)) {
        return null;
    }

    let latestRecord = null;
    let currLatestDate = null;
    data.forEach(currRecord => {        
        if (!latestRecord) {
            latestRecord = currRecord;
            currLatestDate = new Date(currRecord.aprEnd);
            return;
        }

        let currEndDate = new Date(currRecord.aprEnd);
        if (currEndDate > currLatestDate) {
            latestRecord = currRecord;
            currLatestDate = new Date(currRecord.aprEnd);
        }
    })

    return latestRecord;
}

export const filterExecSummaryByUuid = (apiData, pageFilters) => {
    if (!apiData || !Array.isArray(apiData.data)) {
        return null;
    }
    let uuidParam = Array.isArray(pageFilters) && pageFilters.find(p => p.name === 'uuid');
    if (!uuidParam) {
        // just find the apidata with latest APR end date
        return findRecordWithLatestEndDate(apiData.data);
    }

    return apiData.data.find(a => a.uuid === uuidParam.value);
}