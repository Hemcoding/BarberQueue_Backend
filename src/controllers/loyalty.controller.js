import { Loyalty } from "../models/loyalty.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { CreateApiError } from "../utils/CreateApiError.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";

const addPoints = AsyncHandler(async(req, res) => {
        console.log(req.user._id);
        const loyalty = await Loyalty.findOne({user: req.user._id})

        if(!loyalty){
                throw CreateApiError(400, "loyalty points not found")
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
                throw CreateApiError(500, "An error occured while adding points")
        }

        const addedLoyalty = await Loyalty.findById(loyaltyPoints?._id)

        if(!addedLoyalty){
                throw CreateApiError(500, "An error occured while feching data")
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

const redeemPoints = AsyncHandler(async(req, res) => {
        const {points} = req.body

        if(!points){
                throw CreateApiError(400, "Points are required")
        }

        const loyalty = await Loyalty.findOne({user: req.user._id})

        if(!loyalty){
                throw CreateApiError(400, "loyalty points not found")
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
                throw CreateApiError(500, "An error occured while updating points")
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

const getLoyaltyPoints = AsyncHandler(async(req, res) => {
        const loyalty = await Loyalty.findOne({user: req.user?._id})

        console.log("you call me")

        if(!loyalty){
                throw CreateApiError(500, "An error occured while fetching loyalty")
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