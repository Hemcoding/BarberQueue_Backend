import mongoose, { Schema } from "mongoose";

const otpSchema = new Schema({
      email: {
        type: String,
        required: true
      },
      otp: {
        type: String,
        required: true
      },
      otpExpiration: {
        type: Date,
        default: Date.now,
        get:(otpExpiration) => otpExpiration.getTime(),
        set:(otpExpiration) => new Date(otpExpiration)
      }
}, { timestamps: true });

export const Otp = mongoose.model("Otp", otpSchema);
