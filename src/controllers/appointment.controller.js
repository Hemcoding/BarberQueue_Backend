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
import { Artist } from "../models/artist.model.js";

dayjs.extend(utcToLocal);
dayjs.extend(customParseFormat);

const bookAppointment = asyncHandler(async (req, res) => {
    const { date, services, paymentType, artistId, redeemPoints } = req.body;

    let pointsToRupeesRatio = 5;
    let redeemAmountInRupees = redeemPoints / pointsToRupeesRatio;
    redeemAmountInRupees.toFixed(2);

    console.log(
        "date: ",
        date,
        "service: ",
        services,
        "paymentType: ",
        paymentType,
        "artistId: ",
        artistId,
        "points: ",
        redeemAmountInRupees
    );

    if (!date && !services && !paymentType && !artistId) {
        throw createApiError(400, "All fields are required");
    }

    let isWalkInCustomer,
        startTime,
        endTime,
        previousAppointmentEndTime,
        currentTime;

    const shopTime = await ShopTime.find();

    console.log(shopTime);

    let { openingTime, closingTime, lunchBreakStart, lunchBreakEnd } =
        shopTime[0];

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

    console.log(localLunchBreakEnd, localBreakEndDateTime);

    const user = await User.findById(req.user?._id);

    console.log("user: ", user);

    const { role } = user;

    console.log("role: ", role);

    if (role === "admin") {
        isWalkInCustomer = true;
    }

    isWalkInCustomer = false;

    const lastAppointment = await Queue.aggregate([
        { $match: { artist: new mongoose.Types.ObjectId(artistId) } },
        {
            $lookup: {
                from: "appointments",
                localField: "appointment",
                foreignField: "_id",
                as: "appointment",
            },
        },
        { $unwind: "$appointment" },
        {
            $match: {
                "appointment.date": date,
            },
        },
        { $sort: { "appointment.createdAt": -1 } },
        { $limit: 1 },
    ]);

    const lastAppointmentData = lastAppointment[0]?.appointment;

    console.log("lastAppointment: ", lastAppointment);
    console.log("lastAppointmentData: ", lastAppointmentData);

    const currentDate = new Date();

    currentTime = currentDate.getTime();
    if (lastAppointment.length === 0) {
        previousAppointmentEndTime = localOpeningTime;
    } else {
        let previousAppointmentEndDateAndTime =
            date + " " + lastAppointmentData?.endTime;
        let localPreviousAppointmentEndTime = dayjs(
            previousAppointmentEndDateAndTime,
            "YYYY-MM-DD hh:mm A"
        ).valueOf();
        previousAppointmentEndTime = localPreviousAppointmentEndTime;
    }

    console.log("previousAppointmentEndTime: ", previousAppointmentEndTime);

    let { totalDuration, totalPrice } = services.reduce(
        (acc, service) => {
            acc.totalDuration += Number(service.duration);

            acc.totalPrice += service.price;

            return acc;
        },
        { totalDuration: 0, totalPrice: 0 }
    );

    console.log("totalDuration: ", totalDuration);
    console.log("totalPrice: ", totalPrice);

    if (currentTime === previousAppointmentEndTime) {
        startTime = currentTime;
    } else if (currentTime > previousAppointmentEndTime) {
        startTime = currentTime;
    } else {
        startTime = previousAppointmentEndTime;
    }

    console.log("startTime: ", startTime);

    endTime = startTime + totalDuration * 60000;

    console.log("endTime: ", endTime);

    if (endTime > localLunchBreakStart && endTime < localLunchBreakEnd) {
        startTime = localLunchBreakEnd;
    }

    console.log("startTime: ", startTime);

    endTime = startTime + totalDuration * 60000;

    console.log("endTime: ", endTime);

    if (endTime > localClosingTime) {
        return res
            .status(400)
            .json(
                ApiResponse(
                    400,
                    {},
                    "Sorry, the selected appointment time exceeds the shop's closing time.However, we'd be happy to schedule your appointment for tomorrow"
                )
            );
    }

    const localStartTime = dayjs(startTime).format("hh:mm:ss A");
    const localEndTime = dayjs(endTime).format("hh:mm:ss A");

    const artist = await Artist.findById(artistId);

    if (!artist) {
        throw createApiError(500, "artist is not found");
    }

    const appointment = await Appointment.create({
        user,
        artist,
        services,
        date,
        approximatTime: totalDuration,
        startTime: localStartTime,
        endTime: localEndTime,
        status: "pending",
        isWalkInCustomer,
        paymentType,
        serviceCharges: totalPrice,
        redeemAmount: redeemAmountInRupees,
        tax: 5,
    });

    if (!appointment) {
        throw createApiError(
            500,
            "An error occured while creating appointment"
        );
    }

    const createdAppointment = await Appointment.findById(appointment?._id);

    if (!createdAppointment) {
        throw createApiError(
            500,
            "An error occured while fetching appointment"
        );
    }

    return res
        .status(200)
        .json(
            ApiResponse(
                200,
                createdAppointment,
                "Appointment created successfully"
            )
        );
});

const getUpcomingAppointments = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const upcomingAppointments = await Appointment.find({
        user: userId,
        status: "booked",
    }).sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            ApiResponse(
                200,
                upcomingAppointments,
                "Upcoming appointments fetched successfully"
            )
        );
});

const getAppointmentHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const appointmentHistory = await Appointment.find({
        user: userId,
        status: "confirmed",
    }).sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            ApiResponse(
                200,
                appointmentHistory,
                "Appointment history fetched successfully"
            )
        );
});

const getAppointment = asyncHandler(async (req, res) => {
    const { id } = req.body;

    console.log("appointmentid: ", id);

    if (!id) {
        throw createApiError(400, "Id is required");
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
        throw createApiError(
            500,
            "An error occured while fetching appointment"
        );
    }

    return res
        .status(200)
        .json(
            ApiResponse(200, appointment, "Appointment fetched successfully")
        );
});

export {
    bookAppointment,
    getUpcomingAppointments,
    getAppointmentHistory,
    getAppointment,
};
