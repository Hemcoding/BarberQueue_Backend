import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema(
    {
        appointment: {
                type: Schema.Types.ObjectId,
                ref: "Appointment"
        },
        amount: {
                type: Number,
                required: true
        },
        paymentStatus: {
                type: String,
                enum: ["pending", "complete", "faild"],
                default: "pending"
        },
        dateTime: { 
                type: Date,
                required: true,
        }
    },
    { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
