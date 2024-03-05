import mongoose, { Schema } from "mongoose";

const serviceSchema = new Schema(
    {
        serviceName: {
                type: String,
                required: true,
        },
        duration: {
                type: String,
                required: true
        }, 
        price: {
                type: Number,
                required: true
        }
    },
    { timestamps: true }
);

export const Service = mongoose.model("Service", serviceSchema);
