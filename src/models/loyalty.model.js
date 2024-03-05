import mongoose, { Schema } from "mongoose";

const loyaltySchema = new Schema(
    {
       user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
       },
       earnedPoints: {
        type: Number,
        default: 0
       }, 
       redeemedPoints: {
        type: Number,
        default: 0
       },
       balancePoints: {
        type: Number,
        default: 0
       }
    },
    { timestamps: true }
);

export const Loyalty = mongoose.model("Loyalty", loyaltySchema);
