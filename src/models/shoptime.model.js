import mongoose, { Schema } from "mongoose";

const shoptimeSchema = new Schema(
    {
        openingTime: {
                type: String,
                required: true
        },
        closingTime: {
                type: String,
                required: true
        },
        lunchBreakStart: {
                type: String,
                required: true
        },
        lunchBreakEnd: {
                type: String,
                required: true
        }
    },
    { timestamps: true }
);

export const ShopTime = mongoose.model("ShopTime", shoptimeSchema);
