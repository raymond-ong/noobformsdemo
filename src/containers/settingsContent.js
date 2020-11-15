import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Form as SemanticForm, Segment, Button} from "semantic-ui-react";
import Form, {Dropdown as FormDropDown} from '../form/Form';
import './settingsContent.css';
import ShowMessage, {NotifType} from '../helper/notification';
import {deleteImage, fetchImages} from '../actions';
import {createOrReplaceImage, deleteImage as deleteLocalImage} from '../helper/localStorageHelper';



export const convertToDropdownOptions = (imagesStrArr) => {
    if (!Array.isArray(imagesStrArr)) {
        return [];
    }

    return imagesStrArr.map(image => {
        return {
            key: image,
            text: image,
            value: image
        };
    })
}


const SettingsContent = () => {
    const reduxStoreImages = useSelector(state => state.mainApp.masterImages);
    const dispatch = useDispatch();

    const handleFormSubmit = (args) => {
        if (!args || !args.target || !args.target.length > 0 || !args.target[0].files || !args.target[0].files.length > 0 ) {
            ShowMessage("Image uploaded!", NotifType.danger, "Cannot open file!");
            return;
        }

        debugger


        var reader = new FileReader();
        let file = args.target[0].files[0]
        reader.readAsDataURL(file);
        reader.onload = function () {
            //console.log(reader.result);
            // reader.result is in base64 format
            createOrReplaceImage(file.name, reader.result);
            ShowMessage("Image uploaded!", NotifType.success, "Please refresh the browser to see it in the image lists!");
          };        
    }

    const onSubmitDelete = (formData) => {
        if (!formData || !formData.settingsImageDropdown) {
            return;
        }
    
        let fileName = formData.settingsImageDropdown;
        // dispatch(deleteImage(fileName)).then( () => {            
        //     console.log('deleted image!');
        //     ShowMessage("Deleted Image!");
        //     dispatch(fetchImages());
        // });
        deleteLocalImage(fileName);
        ShowMessage("Deleted Image!");
    }
    
    return <div className="settingsContentContainer">
        <iframe name="hiddenFrame" className="hiddenFrame"></iframe>
        <Segment>
            <div className="segmentTitle">Upload Image</div>
            <form 
                className="uploadImageForm"
                encType="multipart/form-data" 
                // action="http://localhost:5000/fileupload"                 
                target="hiddenFrame"
                onSubmit={handleFormSubmit}>
                <input className="ui button fileInputImageUpload" type="file" name="uploadedFile" accept="image/*"/>
                <br/>
                <br/>
                <input className="ui button primary submitBtnImageUpload" type="submit" name="upload"/>
            </form>
        </Segment>

        <Segment>
            <div className="segmentTitle">Delete Image</div>
            <Form className="deleteImageForm" onSubmit={onSubmitDelete}>
                <FormDropDown
                    name="settingsImageDropdown"
                    options={convertToDropdownOptions(reduxStoreImages)}
                    fluid={false}
                />
                <Button color="red">Delete</Button>
            </Form>
        </Segment>
    </div>
}

export default SettingsContent;