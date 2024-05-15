import { ShopTime } from "../models/shoptime.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { CreateApiError } from "../utils/CreateApiError.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";

const setShopTime = AsyncHandler(async (req, res) => {
    const { openingTime, closingTime, lunchBreakStart, lunchBreakEnd } =
        req.body;

    if (!openingTime && !closingTime && !lunchBreakStart && !lunchBreakEnd) {
        throw CreateApiError(400, "All fields are required");
    }

    const shopTime = await ShopTime.create({
        openingTime,
        closingTime,
        lunchBreakStart,
        lunchBreakEnd,
    });

    if (!shopTime) {
        throw CreateApiError(500, "An error occured while creating shopTime");
    }

    const createdShopTime = await ShopTime.findById(shopTime?._id);

    return res
        .status(200)
        .json(
            ApiResponse(200, createdShopTime, "Shop Time created Successfully")
        );
});

const updateShopTime = AsyncHandler(async (req, res) => {
    const { id, openingTime, closingTime, lunchBreakStart, lunchBreakEnd } =
        req.body;

    console.log(
        "all: ",
        id,
        openingTime,
        closingTime,
        lunchBreakStart,
        lunchBreakEnd
    );
    if (
        !id &&
        !openingTime &&
        !closingTime &&
        !lunchBreakStart &&
        !lunchBreakEnd
    ) {
        throw CreateApiError(400, "All fields are required");
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
        throw CreateApiError(500, "An error occured while updating shop time");
    }

    const updatedShopTime = await ShopTime.findById(shopTime?._id);

    return res
        .status(200)
        .json(
            ApiResponse(200, updatedShopTime, "Shop time updated successfully")
        );
});

const getShopTime = AsyncHandler(async (req, res) => {
    const shopTime = await ShopTime.find();

    if (!shopTime) {
        throw CreateApiError(500, "An error occured while fetching shop time");
    }

    return res
        .status(200)
        .json(ApiResponse(200, shopTime, "Shop time fetched successfully"));
});

export { setShopTime, updateShopTime, getShopTime };
