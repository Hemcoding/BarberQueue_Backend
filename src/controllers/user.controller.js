import { AsyncHandler } from "../utils/AsyncHandler.js";
import { CreateApiError } from "../utils/CreateApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import twilio from "twilio";
import { generate } from "otp-generator";
import { Otp } from "../models/otp.model.js";
import nodemailer from "nodemailer";
import Mailgen from "mailgen";
import { response } from "express";
import { otpValidation } from "../utils/otpValidation.js";
import { Loyalty } from "../models/loyalty.model.js";

const options = {
    httpOnly: true,
    secure: true,
};

const generateAccessandRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw CreateApiError(
            500,
            `something went wrong while generating access and refresh token ${error}`
        );
    }
};

const registerUser = AsyncHandler(async (req, res) => {
    const { firstname, email, username, role, description, mobile } = req.body;
    //     if (
    //         [fullname, email, username, password].some((field) => field?.trim() === "")
    //     ) {
    //         throw  CreateApiError(400, "All fields are required")
    //     }

    if (!firstname && !email && !username && !role && !mobile) {
        throw CreateApiError(400, "All field are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        return res.status(409).json(
            {
                success: false,
                statuscode: 409,
                message: "User with eamil and username already exist ",
            }
        );
    }
    if (!req.files?.profilePicture[0]?.path) {
        throw CreateApiError(400, "profile picture is required");
    }

    console.log("url: ", req.files);
    const profilePictureLocalPath = req.files?.profilePicture[0]?.path;

    if (!profilePictureLocalPath) {
        throw CreateApiError(400, "Profile Picture is required");
    }

    const profilePicture = await uploadOnCloudinary(profilePictureLocalPath);

    if (!profilePicture) {
        throw CreateApiError(
            500,
            "Server error while uploading profile picture"
        );
    }

    const user = await User.create({
        firstname,
        profilePicture: profilePicture.url,
        role,
        email,
        description,
        mobile,
        username: username.toLowerCase(),
    });

    console.log("user", user);

    const createdUser = await User.findById(user._id).select(" -refreshToken");

    console.log("createduser", createdUser);

    if (!createdUser) {
        throw CreateApiError(500, "Something went wrong while creating User");
    }

    const loyalty = await Loyalty.create({
        user: user._id,
        earnedPoints: 0,
        redeemedPoints: 0,
        balancePoints: 0,
    });

    if (!loyalty) {
        throw CreateApiError(500, "Failed to create loyalty object");
    }

    return res
        .status(200)
        .json(ApiResponse(200, createdUser, "User create successfully"));
});

const generateOtp = AsyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw CreateApiError(400, "email is required");
    }

    const user = await User.findOne({
        $or: [{ email }],
    });

    if (!user) {
        throw CreateApiError(400, "user does not exist");
    }

    const otp = generate(4, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
    });

    let cDate = new Date();

    await Otp.findOneAndUpdate(
        { email },
        { otp, otpExpiration: new Date(cDate.getTime()) },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASS,
        },
    });

    let mailgenerator = new Mailgen({
        theme: "default",
        product: {
            name: "BarberQueue",
            link: "https://res.cloudinary.com/dabxtjbhp/image/upload/v1708787352/w6xh3i7tbvstrkzbrszh.jpg ",
            // logo: 'link'
        },
    });

    let response = {
        body: {
            name: user.firstname,
            intro: `<p style="font-weight:400; color:gray">Wellcome to BarberQueue! Your OTP for verification is: </p> <center><b style="font-weight:600; font-size:1.5rem; text-align:center; padding:20px">${otp}</b></center>`,
            // otpPlaceholder: otp,
            outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
        },
    };

    let mail = mailgenerator.generate(response);

    let message = {
        from: process.env.EMAIL,
        to: email,
        subject: "OTP verification",
        html: mail,
    };

    transporter.sendMail(message).then(() => {
        return res
            .status(200)
            .json(
                ApiResponse(200, { email }, `OTP sent successfully on ${email}`)
            );
    });
});

const verifyOtpAndLogin = AsyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    console.log("you called me: ", email, otp);

    const otpData = await Otp.findOne({
        email,
        otp,
    });

    if (!otpData) {
        throw CreateApiError(400, "you entered wrong OTP");
    }

    console.log(otpData);

    const isOtpExpire = otpValidation(otpData?.otpExpiration);

    console.log(isOtpExpire);

    if (!isOtpExpire) {
        throw CreateApiError(400, "OTP has been expired");
    }

    const loggedInUser = await User.findOne({
        email,
    }).select(" -refreshToken");

    // const userWithLoyalty = await User.aggregate([
    //     {
    //       $match: { email } 
    //     },
    //     {
    //       $lookup: {
    //         from: 'loyalties', 
    //         localField: '_id', 
    //         foreignField: 'user', 
    //         as: 'loyaltyData'
    //       }
    //     },
    //     {
    //       $project: {
    //         firstname: 1,
    //         username: 1,
    //         profilePicture: 1,
    //         role: 1,
    //         email: 1,
    //         loyaltyData: 1 
    //       }
    //     }
    //   ]);

    if (!loggedInUser) {
        throw CreateApiError(400, "An error occured while fetching user");
    }

    const { accessToken, refreshToken } = await generateAccessandRefreshToken(
        loggedInUser?._id
    );
    return (
        res
            // .cookie("accessToken", accessToken, options)
            // .cookie("refreshToken", refreshToken, options)
            .json(
                ApiResponse(
                    200,
                    {
                        user: loggedInUser,
                        accessToken,
                        refreshToken,
                    },
                    "User logged In Successfully"
                )
            )
    );
});

const logoutUser = AsyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                accessToken: null,
            },
        },
        {
            new: true,
        }
    );
    return res.json(ApiResponse(200, {}, "User logged out Successfully"));
});

const renewAccessToken = AsyncHandler(async (req, res) => {
    const incomingRefreshToken =
        (await req.cookie.refreshToken) || req.body.refreshToken;

    console.log(incomingRefreshToken);

    if (!incomingRefreshToken) {
        throw CreateApiError(401, "Unauthorized request");
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw CreateApiError(401, "Invalid Refresh Token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw CreateApiError(401, "refresh token is expired and used");
        }

        const { accessToken, newRefreshtoken } = generateAccessandRefreshToken(
            user._id
        );

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshtoken, options)
            .json(
                ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshtoken },
                    "Access Token refreshed"
                )
            );
    } catch (error) {
        throw CreateApiError(401, error?.message || "Invalid refresh Token");
    }
});

const getCurrentUser = AsyncHandler(async (req, res) => {
    console.log(req.user);
    return res
        .status(200)
        .json(ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = AsyncHandler(async (req, res) => {
    const { firstname, email, mobile } = req.body;

    if (!(firstname || email || mobile)) {
        throw CreateApiError(400, "All fields are required");
    }

    // console.log(req.user?.fitname, firstname);
    // if (req.user?.firstname === firstname) {
    //     throw CreateApiError(400, "Provided firstname is same as previous");
    // }

    // if (req.user?.email === email) {
    //     throw CreateApiError(400, "Provided email is same as previous");
    // }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                firstname,
                email,
            },
        },
        { new: true }
    ).select("-refreshToken");

    return res
        .status(200)
        .json(ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserProfilePicture = AsyncHandler(async (req, res) => {
    const profilePictureLocalPath = req.file?.path;

    if (!profilePictureLocalPath) {
        throw CreateApiError(400, "Profile picture is required");
    }

    const profilePicture = await uploadOnCloudinary(profilePictureLocalPath);

    if (!profilePicture.url) {
        throw CreateApiError(500, "Error while updating an profile picture");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                profilePicture: profilePicture.url,
            },
        },
        { new: true }
    );

    return res
        .status(200)
        .json(ApiResponse(200, user, "Profile picture updated successfully"));
});

const getUserChannelProfile = AsyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username) {
        throw CreateApiError(400, "Username is required");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $addFields: {
                subcribersCount: {
                    $size: "$subscribers",
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                email: 1,
                subcribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
            },
        },
    ]);

    if (!channel?.length) {
        throw CreateApiError(400, "channel does not exists");
    }

    return res
        .status(200)
        .json(
            ApiResponse(200, channel[0], "User channel fetched successfully")
        );
});

const getWatchHistory = AsyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                ],
            },
        },
    ]);

    if (!user?.length) {
        throw CreateApiError(400, "there is no watch history");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "WatchHistory fetched successfully"
            )
        );
});

const getOwnerDtails = AsyncHandler(async (req, res) => {
    const owner = await User.findOne({
        role: "admin",
    }).select("-email -_id -role -username -refreshToken -loyaltyPoints");

    if (!owner) {
        throw CreateApiError(
            "500",
            "An error occured while fetching owner details"
        );
    }

    return res
        .status(200)
        .json(ApiResponse(200, owner, "Owner details fetched successfully"));
});

const checkUserLoggedIn = AsyncHandler(async (req, res) => {
    const user = req.user;

    if (!user?.accessToken) {
        throw CreateApiError(400, "user is not logged in")
    }

    return res
    .status(200)
    .json(
        ApiResponse(
            200,
            user,
            "User is logged in"
        )
    )
});

export {
    registerUser,
    generateOtp,
    verifyOtpAndLogin,
    logoutUser,
    renewAccessToken,
    getCurrentUser,
    updateAccountDetails,
    updateUserProfilePicture,
    getUserChannelProfile,
    getWatchHistory,
    getOwnerDtails,
    checkUserLoggedIn
};
