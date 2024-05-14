import { Appointment } from "../models/appointment.model.js";
import { Queue } from "../models/queue.model.js";
import { createApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Artist } from "../models/artist.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Loyalty } from "../models/loyalty.model.js";
import nodemailer from "nodemailer";
import Mailgen from "mailgen";

const generateToken = async (appointment) => {
    const cDate = new Date();

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < 3; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    console.log("appointment: ", appointment);
    const { date, artist } = appointment;

    console.log("date: ", date, "artistId: ", artist);

    const [, , day] = date.split("-");

    const artistId = artist[0]._id.toString();
    console.log("artistId: ", artistId);

    const lastTwoDigits = artistId.slice(-2);

    const queueCount = await Appointment.aggregate([
        {
            $match: {
                date: appointment.date,
                artistId: appointment.artistId,
                status: "booked",
            },
        },
        {
            $count: "bookedCount",
        },
    ]);

    console.log("queueCount: ", queueCount);

    const number = queueCount[0]?.bookedCount;

    console.log("number: ", number);

    const token = `BQ-${lastTwoDigits}${result}${number}`;

    console.log("token: ", token);

    return token;
};

const addToQueue = asyncHandler(async (req, res) => {
    const { id, amountPaid } = req.body;

    console.log("id:", id, "amount: ", amountPaid);

    const updateAppointment = await Appointment.findByIdAndUpdate(id, {
        $set: {
            status: "booked",
        },
    });

    console.log("updateAppointment: ", updateAppointment);

    if (!updateAppointment) {
        throw createApiError(
            500,
            "An error occured while updating status in appointment"
        );
    }

    const appointment = await Appointment.findById(id);

    console.log("appointment: ", appointment)

    if (!appointment) {
        throw createApiError(
            500,
            "An error occured while fetching appointment"
        );
    }

    const redeemedPoint = appointment.redeemAmount * 5;

    const queueToken = await generateToken(appointment);

    console.log("token: ", queueToken)

    const artist = await Artist.findById(appointment?.artist[0]._id.toString());

    console.log("artist: ",artist)

    const appointmentInQueue = await Queue.create({
        amountPaid,
        artist,
        appointment,
        tokenNumber: queueToken,
    });

    console.log("appointment in queue: ", appointmentInQueue)

    if (!appointmentInQueue) {
        throw createApiError(
            500,
            "An error occured while adding appointment into queue"
        );
    }

    const addedAppointment = await Queue.findById(appointmentInQueue?._id);

    console.log("addedAppointmeent: ",addedAppointment);
    const loyalty = await Loyalty.findOne({ user: req.user._id }); 

    if (!loyalty) {
        throw createApiError(400, "loyalty points not found");
    }

    const { earnedPoints, balancePoints, redeemedPoints } = loyalty;

    const loyaltyPoints = await Loyalty.findOneAndUpdate(
        { user: req.user?._id },
        {
            earnedPoints: earnedPoints + 10,
            balancePoints: balancePoints + 10,
        }
    );

    if (!loyaltyPoints) {
        throw createApiError(500, "An error occured while adding points");
    }

    const loyaltyPoint = await Loyalty.findOneAndUpdate(
        { user: req.user?._id },
        {
            // earnedPoints: earnedPoints - redeemedPoint,
            balancePoints: balancePoints - redeemedPoint,
            redeemedPoints: redeemedPoints + redeemedPoint
        }
    );

    if (!loyaltyPoint) {
        throw createApiError(500, "An error occured while updating redeem points");
    }


    const addedLoyalty = await Loyalty.findById(loyaltyPoints?._id);

    if (!addedLoyalty) {
        throw createApiError( 500, "An error occured while feching data");
    }

    const appointmentData = await Appointment.findById(addedAppointment.appointment)

    console.log("appointment Data: ", appointmentData)

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASS,
        },
    });

    let mailgenerator = new Mailgen({
        theme: "default",
        product: {
            name: "BarberQueue",
            link: "https://res.cloudinary.com/dabxtjbhp/image/upload/v1708787352/w6xh3i7tbvstrkzbrszh.jpg ",
            // logo: 'link'
        },
    });

    let response = {
        body: {
            name: req.user.firstname,
            intro: `<p style="font-weight:400; color:gray">Wellcome to BarberQueue! 🎉Congatulations! Your appointment has been successfully booked.</p> `,
            table: {
                data: [
                  {
                    key: 'Artist',
                    value: appointmentData.artist[0].artistName
                  },
                  {
                    key: 'Token no.',
                    value: addedAppointment.tokenNumber
                  },
                  {
                    key: 'Date',
                    value: appointmentData.date
                  },
                  {
                    key: 'Time',
                    value: `${appointmentData.startTime} - ${appointmentData.endTime}`
                  },
                ]
              },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
        },
    };

    // const emailHTML = emailBody.replace('Wellcome to BarberQueue! Your OTP for verification is:', `Your OTP for verification is: <b>${otp}</b>`);

    let mail = mailgenerator.generate(response);

    let message = {
        from: process.env.EMAIL,
        to: req.user.email,
        subject: "🗓️ Booking Confirmation",
        html: mail,
    };

    transporter.sendMail(message)

    return res
        .status(200)
        .json(
            ApiResponse(
                200,
                addedAppointment,
                "Appointment added successfully in Queue"
            )
        );
});

const deleteFromQueue = asyncHandler(async (req, res) => {
    const { id, appointmentId } = req.body;

    console.log(id);

    if (!id) {
        throw createApiError(400, "Id is required");
    }

    // const appointmentFromQueue = await Queue.findById(id);

    // console.log("appointmentFromQueue:", appointmentFromQueue);

    // const appointmentId = appointmentFromQueue?.appointment;

    console.log("appointmentId: ", appointmentId);

    const confirmedAppointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        {
            $set: {
                status: "confirmed",
            },
        },
        {
            new: true,
        }
    );

    if (!confirmedAppointment) {
        throw createApiError(
            500,
            "An error occured while updating appointment"
        );
    }

    const deletedAppointmentFromQueue = await Queue.deleteOne({ _id: id });

    if (!deletedAppointmentFromQueue) {
        throw createApiError(
            500,
            "An error occured while removing appointment from queue"
        );
    }

    return res
        .status(200)
        .json(
            ApiResponse(200, {}, "Appointment removed Successfully from queue")
        );
});

const getQueue = asyncHandler(async (req, res) => {
    const { date, artistIds } = req.body;

    console.log("date: ", date, "artistIds: ", artistIds);

    if (!date || !artistIds || artistIds.length === 0) {
        throw createApiError(400, "Date and artistIds are required");
    }

    const queuesByArtist = {};

    // Iterate over artistIds
    for (const artistId of artistIds) {
        const queues = await Queue.aggregate([
            {
                $match: {
                    artist: new mongoose.Types.ObjectId(artistId),
                },
            },
            {
                $lookup: {
                    from: "appointments",
                    localField: "appointment",
                    foreignField: "_id",
                    as: "appointment",
                },
            },
            {
                $unwind: {
                    path: "$appointment",
                    preserveNullAndEmptyArrays: true, // Preserve empty arrays
                },
            },
            {
                $match: {
                    "appointment.date": date,
                },
            },
            {
                $sort: {
                    // Sort by any field in descending order
                    // Here, I'm assuming you have a field like 'createdAt' or '_id' for sorting
                    createdAt: -1,
                },
            },
            {
                $project: {
                    _id: 1,
                    appointmentId: "$appointment._id", // Include the appointment ID
                    artist: 1,
                    amountPaid: 1,
                    tokenNumber: {
                        $ifNull: ["$tokenNumber", null], // Handle cases where tokenNumber is null
                    },
                    startingTime: {
                        $ifNull: ["$appointment.startTime", null], // Handle cases where startTime is null
                    },
                    endingTime: {
                        $ifNull: ["$appointment.endTime", null], // Handle cases where endTime is null
                    },
                    appointmentServiceCharges: "$appointment.serviceCharges", // Debugging: Log appointment serviceCharges
                    appointmentTax: "$appointment.tax", // Debugging: Log appointment tax
                    payableAmount: {
                        $add: [
                            "$appointment.serviceCharges",
                            "$appointment.tax",
                        ],
                    }, // Calculate payableAmount as the sum of serviceCharges and tax
                    remainingAmount: {
                        $subtract: [
                            {
                                $add: [
                                    "$appointment.serviceCharges",
                                    "$appointment.tax",
                                ],
                            },
                            "$amountPaid",
                        ],
                    }, // Calculate remainingAmount as serviceCharges + tax - amountPaid
                },
            },
        ]);

        console.log("Queues:", queues); // Debugging: Log queues to check if data is correctly retrieved

        queuesByArtist[artistId] = queues || []; // Initialize with empty array if queues is null or undefined
    }

    console.log("queuesByArtist: ", queuesByArtist);

    return res
        .status(200)
        .json(ApiResponse(200, queuesByArtist, "Queue fetched successfully"));
});

export { addToQueue, deleteFromQueue, getQueue };
