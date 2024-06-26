import { Appointment } from "../models/appointment.model.js";
import { Queue } from "../models/queue.model.js";
import { CreateApiError } from "../utils/CreateApiError.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
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

const addToQueue = AsyncHandler(async (req, res) => {
    const { id, amountPaid } = req.body;

    console.log("id:", id, "amount: ", amountPaid);

    const updateAppointment = await Appointment.findByIdAndUpdate(id, {
        $set: {
            status: "booked",
        },
    });

    console.log("updateAppointment: ", updateAppointment);

    if (!updateAppointment) {
        throw CreateApiError(
            500,
            "An error occured while updating status in appointment"
        );
    }

    const appointment = await Appointment.findById(id);

    console.log("appointment: ", appointment)

    if (!appointment) {
        throw CreateApiError(
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
        throw CreateApiError(
            500,
            "An error occured while adding appointment into queue"
        );
    }

    const addedAppointment = await Queue.findById(appointmentInQueue?._id);

    console.log("addedAppointmeent: ",addedAppointment);
    const loyalty = await Loyalty.findOne({ user: req.user._id }); 

    if (!loyalty) {
        throw CreateApiError(400, "loyalty points not found");
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
        throw CreateApiError(500, "An error occured while adding points");
    }

    const loyaltyPoint = await Loyalty.findOneAndUpdate(
        { user: req.user?._id },
        {
            
            balancePoints: balancePoints - redeemedPoint,
            redeemedPoints: redeemedPoints + redeemedPoint
        }
    );

    if (!loyaltyPoint) {
        throw CreateApiError(500, "An error occured while updating redeem points");
    }


    const addedLoyalty = await Loyalty.findById(loyaltyPoints?._id);

    if (!addedLoyalty) {
        throw CreateApiError( 500, "An error occured while feching data");
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

const deleteFromQueue = AsyncHandler(async (req, res) => {
    const { id, appointmentId } = req.body;

    console.log(id);

    if (!id) {
        throw CreateApiError(400, "Id is required");
    }


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
        throw CreateApiError(
            500,
            "An error occured while updating appointment"
        );
    }

    const deletedAppointmentFromQueue = await Queue.deleteOne({ _id: id });

    if (!deletedAppointmentFromQueue) {
        throw CreateApiError(
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

const getQueue = AsyncHandler(async (req, res) => {
    const { date, artistIds } = req.body;

    console.log("date: ", date, "artistIds: ", artistIds);

    if (!date || !artistIds || artistIds.length === 0) {
        throw CreateApiError(400, "Date and artistIds are required");
    }

    const queuesByArtist = {};

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
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $match: {
                    "appointment.date": date,
                },
            },
            {
                $sort: {
                    createdAt: -1,
                },
            },
            {
                $project: {
                    _id: 1,
                    appointmentId: "$appointment._id",
                    artist: 1,
                    amountPaid: 1,
                    tokenNumber: {
                        $ifNull: ["$tokenNumber", null],
                    },
                    startingTime: {
                        $ifNull: ["$appointment.startTime", null], 
                    },
                    endingTime: {
                        $ifNull: ["$appointment.endTime", null],
                    },
                    appointmentServiceCharges: "$appointment.serviceCharges",
                    appointmentTax: "$appointment.tax",
                    payableAmount: {
                        $add: [
                            "$appointment.serviceCharges",
                            "$appointment.tax",
                        ],
                    },
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
                    }, 
                },
            },
        ]);

        console.log("Queues:", queues); 

        queuesByArtist[artistId] = queues || [];
    }

    console.log("queuesByArtist: ", queuesByArtist);

    return res
        .status(200)
        .json(ApiResponse(200, queuesByArtist, "Queue fetched successfully"));
});

export { addToQueue, deleteFromQueue, getQueue };
