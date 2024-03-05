import mongoose, { Schema } from "mongoose";

const offerSchema = new Schema(
    {
        offerImage: {
            type: String,
            required: true,
        },
        linkURL: {
            type: String,
            required: true
        },
        discountPercentage: {
            type: Number,
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
    },
    { timestamps: true }
);

export const Offer = mongoose.model("Offer", offerSchema);

const deleteExpiredOffers = async () => {
    const currentDate = new Date();
    try {
        const expiredOffers = await Offer.find({
            endDate: { $lt: currentDate },
        });
        await Offer.deleteMany({
            _id: { $in: expiredOffers.map((offer) => offer._id) },
        });
        console.log(`${expiredOffers.length} expired offers deleted`);
    } catch (error) {
        console.error("Error deleting expired offers:", error);
    }
};

// Schedule the deleteExpiredOffers function to run at regular intervals (e.g., every hour)
setInterval(deleteExpiredOffers, 3600000); // Runs every hour (36
