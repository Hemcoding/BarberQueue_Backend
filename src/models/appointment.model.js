import mongoose, { Schema } from "mongoose";

const appointmentSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        service: {
            type: Schema.Types.ObjectId,
            ref: "Service",
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        startTime: {
            type: String,
            required: true,
        },
        endTime: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["booked", "confirmed", "cancelled"],
            default: "booked",
        },
        isWalkInCustomer: {
            type: Boolean,
            default: false,
        },
        paymentType: {
            type: String,
            enum: ["full payment", "token payment"],
            default: "token payment",
        },

    },
    { timestamps: true }
);

export const Appointment = mongoose.model("Appointment", appointmentSchema);

