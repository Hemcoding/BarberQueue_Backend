import { Offer } from "../models/offer.model.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { createApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

const createOffer = AsyncHandler(async (req, res) => {
        const user = await User.findById(req.user?._id).select(
            "-firstname -username -email -profilePicture -loyaltyPoints -refreshToken"
        );
    
        if (user.role !== "admin") {
            throw createApiError(400, "you can not create an Offer");
        }
    
        const { discountPercentage, startDate, endDate ,linkURL} = req.body;
    
        if (!linkURL) {
            throw createApiError(400, "All fields are requred !");
        }
    
        const offerImageLocalFilePath = req.file?.path;
    
        if (!offerImageLocalFilePath) {
            throw createApiError(400, "Offer Image is required");
        }
    
        const offerImage = await uploadOnCloudinary(offerImageLocalFilePath);
    
        if (!offerImage) {
            throw createApiError(500, "Server error while uploading offer image");
        }
    
        const offer = await Offer.create(
            {
                offerImage: offerImage.url,
                discountPercentage,
                startDate,
                endDate,
                linkURL
            }
        );

        const createdOffer = await Offer.findById(offer?._id);
    
        return res
            .status(200)
            .json(ApiResponse(200, createdOffer, "Offer created successfully"));
    });

const updateOffer = AsyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select(
        "-firstname -username -email -profilePicture -loyaltyPoints -refreshToken"
    );

    if (user.role !== "admin") {
        throw createApiError(400, "you can not create an Offer");
    }

    const { id, discountPercentage, startDate, endDate } = req.body;

    if (!id && !discountPercentage && !startDate && !endDate) {
        throw createApiError(400, "All fields are requred !");
    }

    const offerImageLocalFilePath = req.file?.path;

    console.log(offerImageLocalFilePath);

    if (!offerImageLocalFilePath) {
        throw createApiError(400, "Offer Image is required");
    }

    const offerImage = await uploadOnCloudinary(offerImageLocalFilePath);

    if (!offerImage) {
        throw createApiError(500, "Server error while uploading offer image");
    }

    console.log(id);

    const offer = await Offer.findByIdAndUpdate(
        id,
        {
            $set: {
                discountPercentage,
                startDate,
                endDate,
            },
        },
        {
            new: true,
        }
    );

    if (!offer) {
        throw createApiError(400, "offer is not exist")
    }

    const createdOffer = await Offer.findById(offer?._id);

    return res
        .status(200)
        .json(ApiResponse(200, createdOffer, "Offer created successfully"));
});

const getOffer = AsyncHandler(async (req, res) => {
    const offers = await Offer.find().select("-startDate, -endDate");

    if (!offers) {
        throw createApiError(
            500,
            "Something went wrong white fetching offers data"
        );
    }

    return res
        .status(200)
        .json(ApiResponse(200, offers, "Offers Data fetched successfully"));
});

export {createOffer, updateOffer, getOffer };
