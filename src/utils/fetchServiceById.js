import { Service } from "../models/service.model.js";
import mongoose from "mongoose";

const fetchServicesByIds = async (serviceIds) => {
    try {
        // Convert serviceIds to ObjectId
        const serviceObjectIds = serviceIds.map((id) =>
            new mongoose.Types.ObjectId(id)
        );

        // Fetch services from the Service collection based on the provided serviceIds
        const services = await Service.find({ _id: { $in: serviceObjectIds } });

        return services;
    } catch (error) {
        console.error("Error fetching services:", error);
        throw error;
    }
};

export default fetchServicesByIds;
