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
            type: Number,
            required: true,
            unique: true,
        },
        appointmentExpiration: {
            type: Date,
            default: Date.now,
            get:(appointmentExpiration) => appointmentExpiration.getTime(),
            set:(appointmentExpiration) => new Date(appointmentExpiration)
          }
    },
    { timestamps: true }
);

export const Queue = mongoose.model("Queue", queueSchema);
