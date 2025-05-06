import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

//method to generate access and refresh token
const generateAccessAndRefreshTocken = async (userId) =>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken; //save the refresh token in the DB
        await user.save({validateBeforeSave: false}); // seedha jaake save kardo (no need for validation)
        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token!")
    }
}

//________________REGISTER USER______________
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

//________________LOGIN USER______________
const loginUser = asyncHandler(async (req, res) =>{
    //take all the required details
    //validate all details
    //check if details exists in the DB (username or email)
    //check and validate password
    //generate access and refresh tokens
    //send cookies

    const {username, email, password} = req.body;
    if(!username && !email){
        return new ApiError(400, "User or Email is required!");
    }

    const userPresent = await User.findOne({
        $or: [{username},{email}] //find in the DB, if either of them exists?
    })

    if(!userPresent){
        return new ApiError(400, "User does not exists!")   
    }

    const isValidPassword = await userPresent.isPasswordCorrect(password);
    if(!isValidPassword){
        return new ApiError(400, "Password Incorrect!")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTocken(userPresent._id)

    const loggedInUser = await User.findOne(userPresent._id).select("-password -refreshToken"); //no need to return password and refreshToken

    const options  = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User Logged IN Successfully!"
        )
    )
})


const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
    req.user._id,
    {
        $set: {
        refreshToken: undefined, //refresh token removed from DB
        },
    },
    {
        new: true,
    }
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(
        200,
        {},
        "User logged out successfully!"
    ))
});


const refreshAccessToken = asyncHandler(async (req, res) =>{
    //access refresh token from cookie
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorised request!");
    }

    ///verify token
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token!");
        }
    
        //validate
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is expired or used!");
        }
    
        //generate the new refresh token
        const options = {
            httpOnly: true,
            secure:true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTocken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken : newRefreshToken
                },
                "Access Token Refreshed Successfully!"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError(404, "password Incorrect!");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "password changes successfully!"
        )
    )
})

const getCurrectUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(200, req.user, "current user fetched");
})

const updateAccountDetails = asyncHandler (async (req, res) => {
    const {fullName, email} = req.body;
    if(!fullName || !email) {
        throw new ApiError(400, "all fields are required!");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName:fullName,
                email: email
            }
        },
        {new: true}
    ).select("-password");

    return res
    .staus(200)
    .json(
        new ApiResponse(200, user, "account details updated!")
    )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPaht = req.file?.path;

    if(!avatarLocalPaht){
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPaht)
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on cloudanry");
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }, {new:true}).select("-password");

    return res
    .status(200)
    .json(new ApiResponse (
        200,
        user,
        "avatar updated!"
    ))
})
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400, "coverImage file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on cloudanry");
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            coverImage: coverImage.url
        }
    }, {new:true}).select("-password")

    return res
    .status(200)
    .json(new ApiResponse (
        200,
        user,
        "coverImage updated!"
    ))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrectUser,
    updateUserAvatar,
    updateUserCoverImage
}