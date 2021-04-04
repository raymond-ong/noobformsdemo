export const localSaveLayout = (layout, name, layoutData) => {
    if (typeof(Storage) === "undefined") {
        console.error("localSaveLayout: browser does not supoort Local Storage");
        return;
    }

    let savedLayouts = [];
    let savedLayoutsStr = localStorage.getItem("layouts");
    if (savedLayoutsStr) {
        savedLayouts = JSON.parse(savedLayoutsStr)
    }

    // Find any existing layout with same name. Remove it and replace with our new one.
    let ret = createOrReplaceLayout(savedLayouts, layout, name, layoutData);

    localStorage.setItem("layouts", JSON.stringify(savedLayouts));
    console.log("localSaveLayout");

    return ret;
}

const createOrReplaceLayout = (savedLayouts, layout, name, layoutData) => {
    let newObj = {
        name,
        layoutJson: JSON.stringify(layout),
        numRows: layoutData.rows,
        numCols: layoutData.columns,
        pageFilterFields: JSON.stringify(layoutData.pageFilterFields),
        pageApiData: JSON.stringify(layoutData.pageApiData),
    }

    let existingLayoutIdx = savedLayouts.findIndex(x => x.name === name);
    if (existingLayoutIdx !== -1) {
        savedLayouts[existingLayoutIdx] = newObj;
    }
    else {
        savedLayouts.push(newObj);
    }

    return newObj;
}


export const localFetchLayouts = () => {
    let layoutsStr = localStorage.getItem('layouts');
    if (!layoutsStr) {
        return [];
    }

    return JSON.parse(layoutsStr);
}


export const localFetchHierarchies = () => {
    let hierarchiesStr = localStorage.getItem('hierarchies');
    if (!hierarchiesStr) {
        return [];
    }

    return JSON.parse(hierarchiesStr);
}

export const localSaveHierarchy = (hierarchyJson, nodeSettingsJson) => {
    if (typeof(Storage) === "undefined") {
        console.error("localSaveHierarchy: browser does not supoort Local Storage");
        return;
    }

    let savedHierarchies = [];
    let savedHierarchiesStr = localStorage.getItem("hierarchies");
    if (savedHierarchiesStr) {
        savedHierarchies = JSON.parse(savedHierarchiesStr)
    }

    // Find any existing layout with same name. Remove it and replace with our new one.
    createOrReplaceHierarchies(savedHierarchies, hierarchyJson, nodeSettingsJson);

    localStorage.setItem("hierarchies", JSON.stringify(savedHierarchies));
    console.log("localSaveHierarchy");    
}

const defaultViewName = "Default";
const createOrReplaceHierarchies = ( savedHierarchies, hierarchyJson, nodeSettingsJson ) => {
    let newObj = {
        viewName: defaultViewName,
        hierarchyJson, 
        nodeSettingsJson
    };

    let existingHierIdx = savedHierarchies.findIndex(x => x.viewName === defaultViewName);
    if (existingHierIdx !== -1) {
        savedHierarchies[existingHierIdx] = newObj;
    }
    else {
        savedHierarchies.push(newObj);
    }    
}

export const createOrReplaceImage = (name, data) => {
    let newObj = {
        name,
        data
    };

    let allImages = [];
    let allImagesStr = localStorage.getItem("images");
    if (allImagesStr) {
        allImages = JSON.parse(allImagesStr);
    }

    let existingImageIdx = allImages.findIndex(x => x.name === name);
    if (existingImageIdx !== -1) {
        allImages[existingImageIdx] = newObj;
    }
    else {
        allImages.push(newObj);
    }    

    localStorage.setItem("images", JSON.stringify(allImages));

}

export const getImageListFromLocal = () => {
    let allImagesStr = localStorage.getItem("images");
    if (!allImagesStr) {
        console.error("Could not get images from Local Storage");
        return [];
    }
    let allImages = JSON.parse(allImagesStr);
    return allImages.map(x => x.name);
}

export const getImageFromLocal = (name) => {
    let allImagesStr = localStorage.getItem("images");
    let allImages = JSON.parse(allImagesStr);
    const findImageIndex = allImages.findIndex(x => x.name === name);
    if (findImageIndex < 0) {
        return null;
    }

    const image = allImages[findImageIndex];
    return image.data;
}

export const deleteImage = (name) => {
    let allImagesStr = localStorage.getItem("images");
    if (!allImagesStr) {
        console.error("Could not get images from Local Storage");
        return [];
    }
    let allImages = JSON.parse(allImagesStr);
    let existingImageIdx = allImages.findIndex(x => x.name === name);
    if (existingImageIdx !== -1) {
        allImages.splice(existingImageIdx, 1);
        localStorage.setItem("images", JSON.stringify(allImages));
    }
}