import mongoose, { Schema } from "mongoose";

const queueSchema = new Schema(
    {
        artist: {
            type: Schema.Types.ObjectId,
            ref: "Artist",
            required: true,
            index: true,
        },
        appointment: {
            type: Schema.Types.ObjectId,
            ref: "Appointment",
            required: true,
            index: true,
        },
        tokenNumber: {
            type: String,
            required: true,
            unique: true,
        },
        amountPaid: {
            type: Number,
            required: true
        }
    },
    { timestamps: true }
);

export const Queue = mongoose.model("Queue", queueSchema);
