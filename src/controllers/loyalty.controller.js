import { Loyalty } from "../models/loyalty.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { createApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addPoints = asyncHandler(async(req, res) => {
        console.log(req.user._id);
        const loyalty = await Loyalty.findOne({user: req.user._id})

        if(!loyalty){
                throw createApiError(400, "loyalty points not found")
        }

        const {earnedPoints, balancePoints} = loyalty;

        const loyaltyPoints = await Loyalty.findOneAndUpdate(
                {user: req.user?._id},
                {
                        earnedPoints: earnedPoints + 10,
                        balancePoints: balancePoints + 10
                }
        )

        if(!loyaltyPoints){
                throw createApiError(500, "An error occured while adding points")
        }

        const addedLoyalty = await Loyalty.findById(loyaltyPoints?._id)

        if(!addedLoyalty){
                throw createApiError(500, "An error occured while feching data")
        }

        return res 
        .status(200)
        .json(
                ApiResponse(
                        200,
                        addedLoyalty,
                        "Points added successfully"
                )
        )
})

const redeemPoints = asyncHandler(async(req, res) => {
        const {points} = req.body

        if(!points){
                throw createApiError(400, "Points are required")
        }

        const loyalty = await Loyalty.findOne({user: req.user._id})

        if(!loyalty){
                throw createApiError(400, "loyalty points not found")
        }

        const {redeemedPoints, balancePoints} = loyalty;


        const redeemedLoyalty = await Loyalty.findOneAndUpdate(
                {user: req.user?._id},
                {
                        redeemedPoints: redeemedPoints + points,
                        balancePoints: balancePoints - points
                }
        )

        if(!redeemedLoyalty){
                throw createApiError(500, "An error occured while updating points")
        }

        const updatedLoyalty = await Loyalty.findById(redeemedLoyalty?._id)

        return res
        .status(200)
        .json(
                ApiResponse(
                        200, 
                        updatedLoyalty,
                        "Points redeemed successfully"
                )
        )
})

const getLoyaltyPoints = asyncHandler(async(req, res) => {
        const loyalty = await Loyalty.findOne({user: req.user?._id})

        console.log("you call me")

        if(!loyalty){
                throw createApiError(500, "An error occured while fetching loyalty")
        }

        return res
        .status(200)
        .json(
                ApiResponse(
                        200,
                        loyalty,
                        "Loyalty points fetched successfully"
                )
        )
})

export {
        addPoints,
        redeemPoints,
        getLoyaltyPoints
}