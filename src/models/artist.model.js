import mongoose, { Schema } from "mongoose";

const artistSchema = new Schema(
    {
       artistName: {
        type: String,
        required: true
       }
    },
    { timestamps: true }
);

export const Artist = mongoose.model("Artist", artistSchema);
