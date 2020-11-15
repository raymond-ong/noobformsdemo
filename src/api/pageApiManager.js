import axios from 'axios';

export const fetchPageData = async (url, setIsLoading, setApiData) => {
    setIsLoading(true);
    const result = await axios.get(url)
    .catch(error =>{
        console.error("Error fetching page data from url", url);
    });
    setIsLoading(false);
    setApiData(result);
}

export const fetchPageDataSync = async (url) => {
    const result = await axios.get(url)
    .catch(error =>{
        console.error("Error fetching page data from url:", url);
    });

    return result;
}

export const fetchPageDataAsync = async (url) => {
    return axios.get(url)
}