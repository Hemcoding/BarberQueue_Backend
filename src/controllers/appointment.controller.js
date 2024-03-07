import { Queue } from "../models/queue.model.js";
import { User } from "../models/user.model.js";
import { createApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import dayjs from "dayjs";
import utcToLocal from "dayjs/plugin/utc.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import { ShopTime } from "../models/shoptime.model.js";
import { Appointment } from "../models/appointment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

dayjs.extend(utcToLocal);
dayjs.extend(customParseFormat);

const bookAppointment = asyncHandler(async (req, res) => {
    
    const { date, services, paymentType, artistId } = req.body;

    if (!date && !services && !paymentType && !artistId) {
        throw createApiError(400, "All fields are required");
    }

    // console.log(services)

    // const services = await fetchServicesByIds(serviceIds);

    console.log( "services:", services
    )

    let isWalkInCustomer,
        startTime,
        endTime,
        previousAppointmentEndTime,
        currentTime;

    const shopTime = await ShopTime.find();

    console.log(shopTime)

    let { openingTime, closingTime, lunchBreakStart, lunchBreakEnd } = shopTime[0];

    const localOpeningDateTime = date + " " + openingTime;
    const localClosingDateTime = date + " " + closingTime;
    const localBreakStartDateTime = date + " " + lunchBreakStart;
    const localBreakEndDateTime = date + " " + lunchBreakEnd;

    let localOpeningTime = dayjs(
        localOpeningDateTime,
        "YYYY-MM-DD hh:mm A"
    ).valueOf();
    let localClosingTime = dayjs(
        localClosingDateTime,
        "YYYY-MM-DD hh:mm A"
    ).valueOf();
    let localLunchBreakStart = dayjs(
        localBreakStartDateTime,
        "YYYY-MM-DD hh:mm A"
    ).valueOf();
    let localLunchBreakEnd = dayjs(
        localBreakEndDateTime,
        "YYYY-MM-DD hh:mm A"
    ).valueOf();

    console.log(localLunchBreakEnd, localBreakEndDateTime)

    const user = await User.findById(req.user?._id);

    console.log("user: ", user)

    const { role } = user;

    console.log("role: ",role)

    if (role === "admin") {
        isWalkInCustomer = true;
    }

    isWalkInCustomer = false;

    const lastAppointment = await Queue.aggregate([
        // Match queue entries for the specified artist
        { $match: { artist: new mongoose.Types.ObjectId(artistId) } },
        // Lookup to join with the Appointment collection
        {
            $lookup: {
                from: "appointments", // Collection name of Appointment model
                localField: "appointment",
                foreignField: "_id",
                as: "appointment",
            },
        },
        // Unwind the appointment array
        { $unwind: "$appointment" },
        // Sort appointments by creation date in descending order
        { $sort: { "appointment.createdAt": -1 } },
        // Limit the result to 1 document (last appointment)
        { $limit: 1 },
    ]);

    // Extract the last appointment from the result
    const lastAppointmentData = lastAppointment[0]?.appointment;

    console.log("lastAppointment: ", lastAppointment)
    console.log("lastAppointmentData: ", lastAppointmentData)

    const currentDate = new Date();

    //const currentTime = currentDate.getHours() + ":" + currentDate.getMinutes();
    currentTime = currentDate.getTime();
    if (lastAppointment.length === 0) {
 
        // localCurrentTime = dayjs(currentTime).utc().local();
        previousAppointmentEndTime = localOpeningTime;
    } else {
        let previousAppointmentEndDateAndTime = date + " " + lastAppointmentData?.endTime
        let localPreviousAppointmentEndTime = dayjs(
            previousAppointmentEndDateAndTime,
            "YYYY-MM-DD hh:mm A"
        ).valueOf();
        previousAppointmentEndTime = localPreviousAppointmentEndTime;
    }

    console.log("previousAppointmentEndTime: ", previousAppointmentEndTime)

    const { totalDuration, totalPrice } = services.reduce(
        (acc, service) => {
            // Accumulate duration
            acc.totalDuration += service.duration;

            // Accumulate price
            acc.totalPrice += service.price;

            return acc;
        },
        { totalDuration: 0, totalPrice: 0 }
    );

    console.log("totalDuration: ", totalDuration)
    console.log("totalPrice: ", totalPrice)

    if (currentTime === previousAppointmentEndTime) {
        startTime = currentTime;
    } else if (currentTime > previousAppointmentEndTime) {
        startTime = currentTime;
    } else {
        startTime = previousAppointmentEndTime;
    }

    console.log("startTime: ", startTime)

    endTime = startTime + totalDuration * 60000;

    console.log("endTime: ", endTime)

    if (endTime > localLunchBreakStart && endTime < localLunchBreakEnd) {
        startTime = localLunchBreakEnd;
    }

    console.log("startTime: ", startTime)

    endTime = startTime + totalDuration * 60000;

    console.log("endTime: " ,endTime);

    if(endTime > localClosingTime){
        throw createApiError(400, "Sorry, the selected appointment time exceeds the shop's closing time.However, we'd be happy to schedule your appointment for tomorrow")
    }

    const localStartTime = dayjs(startTime).format("hh:mm:ss A")
    const localEndTime = dayjs(endTime).format("hh:mm:ss A")

    const appointment = await Appointment.create({
        user,
        artistId,
        services,
        date,
        startTime: localStartTime,
        endTime: localEndTime,
        status: "pending",
        isWalkInCustomer,
        paymentType,
        serviceCharges: totalPrice,
        tax: 5 
    });

    if(!appointment){
        throw createApiError(500, "An error occured while creating appointment")
    }

    const createdAppointment = await Appointment.findById(appointment?._id)

    if(!createdAppointment){
        throw createApiError(500, "An error occured while fetching appointment")
    }

    return res
    .status(200)
    .json(
        ApiResponse(
            200, 
            createdAppointment,
            "Appointment created successfully"
        )
    )
});

export {
    bookAppointment
}