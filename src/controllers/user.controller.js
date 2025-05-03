import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler( async (req, res) =>{
    //get user details from frontend
    const {fullName,email,username, password} = req.body;
    console.log(`email is: ${email}, username is: ${username}, password is: ${password}, fullName is: ${fullName}`); 
    
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);

    //validation of the details (empty/non empty)
    if(!fullName || !email || !username || !password){
        throw new ApiError(400, "Fill all the fields");
    }
    //check if user already exists (check by username,email)
    const userExists = await User.findOne({
        $or: [{ username } , { email }]
    })
    
    if(userExists) {
        throw new ApiError(400, "Username or email  already Exists!");
    }
    
    //check for images
    console.log('req.files:', req.files);
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    //check for avatar(compolsary)
    if (!avatarLocalPath) {
    console.log('Avatar not received or not processed by multer.');
    throw new ApiError(400, "Avatar file is required");
    }
    console.log(avatarLocalPath);
    
    //upload them to cloudnary 
    const avatarCloudUploaded = await uploadOnCloudinary(avatarLocalPath)
    const coverImageCloudUploaded = await uploadOnCloudinary(coverImageLocalPath)

    // and check if it uploaded or not 
    if(!avatarCloudUploaded){
        throw new ApiError(400, "Avatar file is required");
    }
    //create user object - creat entry in DB
    const user = await User.create({
        fullName,
        avatar: avatarCloudUploaded.url,
        coverImage: coverImageCloudUploaded?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    //validate user
    // remove password and refresh token from response
    //check for user creation
    const userCreated = await User.findById(user._id).select( //select the things you dont want
        "-password -refreshToken"
    )
    if(!userCreated) {
        throw new ApiError(500, "Something went wrong while registering the user!")
    }
    //return the API Response
    return res.status(201).json(
        new ApiResponse(200, userCreated,"User Registered Successfully!")
    )
})

export {registerUser}