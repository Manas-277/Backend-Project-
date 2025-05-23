import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

//check if logged in or not
export const verifyJWT = asyncHandler(async (req,_, next) =>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","") 
        if(!token) {
            throw new ApiError(400, "Unauthorized request");
        }
        
        const decodedTokenInfo = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedTokenInfo?._id).select(
            "-password -refreshToken"
        )
    
        if(!user) {
            throw new ApiError(401, "Invalid Access Token");
        }
    
        req.user = user;
        next();
    } catch (error) {   
        throw new ApiError(401, error?.meaage ||  "Invalid access token")
    }

})