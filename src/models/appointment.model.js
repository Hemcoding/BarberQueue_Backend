import mongoose, { Schema } from "mongoose";

const serviceSchema = new Schema({
    serviceName: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
});

const appointmentSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        artistId: {
            type: String,
            required: true,
        },
        services: [serviceSchema],
        date: {
            type: String,
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
            enum: ["pending", "booked", "confirmed", "cancelled"],
            default: "pending",
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
        serviceCharges: {
            type: Number,
            required: true,
        },
        tax: {
            type: Number,
            default: 5,
        },
    },
    { timestamps: true }
);

export const Appointment = mongoose.model("Appointment", appointmentSchema);

const deletePendingAppointments = async () => {
    try {
      // Delete appointments with status "pending"
      const result = await Appointment.deleteMany({ status: "pending" });
  
      console.log(`${result.deletedCount} pending appointments deleted successfully.`);
    } catch (error) {
      console.error("Error deleting pending appointments:", error);
    }
  };

  setInterval(deletePendingAppointments, 900000);