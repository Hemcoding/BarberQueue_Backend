import { ShopTime } from "../models/shoptime.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { createApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const setShopTime = asyncHandler(async (req, res) => {
    const { openingTime, closingTime, lunchBreakStart, lunchBreakEnd } =
        req.body;

    if (!openingTime && !closingTime && !lunchBreakStart && !lunchBreakEnd) {
        throw createApiError(400, "All fields are required");
    }

    const shopTime = await ShopTime.create({
        openingTime,
        closingTime,
        lunchBreakStart,
        lunchBreakEnd,
    });

    if (!shopTime) {
        throw createApiError(500, "An error occured while creating shopTime");
    }

    const createdShopTime = await ShopTime.findById(shopTime?._id);

    return res
        .status(200)
        .json(
            ApiResponse(200, createdShopTime, "Shop Time created Successfully")
        );
});

const updateShopTime = asyncHandler(async (req, res) => {
    const { id, openingTime, closingTime, lunchBreakStart, lunchBreakEnd } =
        req.body;

    if (
        !id &&
        !openingTime &&
        !closingTime &&
        !lunchBreakStart &&
        !lunchBreakEnd
    ) {
        throw createApiError(400, "All fields are required");
    }

    const shopTime = await ShopTime.findByIdAndUpdate(
        id,
        {
            $set: {
                openingTime,
                closingTime,
                lunchBreakStart,
                lunchBreakEnd,
            },
        },
        { new: true }
    );

    if (!shopTime) {
        throw createApiError(500, "An error occured while updating shop time");
    }

    const updatedShopTime = await ShopTime.findById(shopTime?._id);

    return res
        .status(200)
        .json(
            ApiResponse(200, updatedShopTime, "Shop time updated successfully")
        );
});

const getShopTime = asyncHandler(async(req, res) => {
        const shopTime = await ShopTime.find()

        if(!shopTime){
                throw createApiError(500, "An error occured while fetching shop time")
        }

        return res
        .status(200)
        .json(
                ApiResponse(
                        200,
                        shopTime,
                        "Shop time fetched successfully"
                )
        )
})

export { setShopTime, updateShopTime, getShopTime};
