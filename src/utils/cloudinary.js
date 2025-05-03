import {v2 as cloudinary} from 'cloudinary'
import { log } from 'console';
import fs from 'fs' //library present in Node.js

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if(!localFilePath) return null
        //upload the file
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type:'auto'
        })
        //file has been uploaded
        // console.log("File uploaded successfully on Cloudinary!", response.url);
        // console.log("local file path is: ", localFilePath);
        //unlink the successfully uploaded file
        fs.unlinkSync(localFilePath);
        //return the response
        // console.log("response from cloudinary is: ", response);
        return response;
    } catch (error) {
        // Check if the file exists before attempting to delete it
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath); // Remove the temporary file
        }//remove the locally saved temporary files as the upload operation got failed
        return null;
    }
}


export {uploadOnCloudinary}