import mongoose, { Schema } from "mongoose";

const staffSchema = new Schema(
    {
        staffImage: {
            type: String,
            required: true,
        },
        publicId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        specialistIn: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export const Staff = mongoose.model("Staff", staffSchema);
