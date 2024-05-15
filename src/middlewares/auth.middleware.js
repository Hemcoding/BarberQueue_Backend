import { User } from "../models/user.model.js";
import { CreateApiError } from "../utils/CreateApiError.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = AsyncHandler(async (req, res, next) => {
    try {
        const token =
            // req.cookies?.accessToken 
            // ||
            req.header("Authorization")?.replace("Bearer ", "");

            console.log(token);
    
        if (!token) {
            throw CreateApiError(401, "Unauthorized request");
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        console.log(decodedToken._id);
    
        const user = await User.findById(decodedToken._id).select(
            "-password"
        );

        console.log(user);
    
        if(!user){
            throw CreateApiError(401, "Invalid Access Token")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw CreateApiError(401,error || "Invalid Access Token")
    }
    
});
