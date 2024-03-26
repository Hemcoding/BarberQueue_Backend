import { Appointment } from "../models/appointment.model.js";
import { Queue } from "../models/queue.model.js";
import { createApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Artist } from '../models/artist.model.js'
import {ApiResponse} from "../utils/ApiResponse.js"
import mongoose from "mongoose";

const generateToken = async (appointment) => {
    const cDate = new Date();

    console.log("appointment: ", appointment)
    const { date, artist } = appointment;

    console.log("date: ", date, "artistId: ", artist)

    const [, , day] = date.split("-");

    const artistId = artist[0]._id.toString()
    console.log("artistId: ", artistId)

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

     console.log("queueCount: " ,queueCount)

     const number = queueCount[0]?.bookedCount;

     console.log("number: ", number)

     const token = `BQ-${lastTwoDigits}${day}${number}`

     console.log("token: ", token)

     return token
};

const addToQueue = asyncHandler(async (req, res) => {
    const { id } = req.body;

    console.log("id:", id)

    const updateAppointment = await Appointment.findByIdAndUpdate(
        id,
        {
            $set:{
                status: "booked"
            }
        }
    )

    if(!updateAppointment){
        throw createApiError(500, "An error occured while updating status in appointment")
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
        throw createApiError(
            500,
            "An error occured while fetching appointment"
        );
    }

    const queueToken = await generateToken(appointment);

    const artist = await Artist.findById(appointment?.artist[0]._id.toString())

    const appointmentInQueue = await Queue.create({
        artist,
        appointment,
        tokenNumber : queueToken
    })

    if(!appointmentInQueue){
        throw createApiError(500, "An error occured while adding appointment into queue")
    }

    const addedAppointment = await Queue.findById(appointmentInQueue?._id)

    return res
    .status(200)
    .json(
        ApiResponse(
            200,
            addedAppointment,
            "Appointment added successfully in Queue"
        )
    )

});

const deleteFromQueue = asyncHandler(async(req, res) => {
    const { id } = req.body;

    if(!id){
        throw createApiError(400, "Id is required")
    }

    const appointmentFromQueue = await Queue.findById(id)

    console.log("appointmentFromQueue:" , appointmentFromQueue)

    const appointmentId = appointmentFromQueue?.appointment

    console.log("appointmentId: ", appointmentId)

    const confirmedAppointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        {
            $set: {
                status: "confirmed"
            }
        },
        {
            new:true
        }
    )

    if(!confirmedAppointment){
        throw createApiError(500, "An error occured while updating appointment")
    }

    const deletedAppointmentFromQueue = await Queue.deleteOne({_id: id});

    if(!deletedAppointmentFromQueue){
        throw createApiError(500, "An error occured while removing appointment from queue")
    }

    return res
    .status(200)
    .json(
        ApiResponse(
            200,
            {},
            "Appointment removed Successfully from queue"
        )
    )
})

const getQueue = asyncHandler(async(req, res) => {
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
                    "artist": new mongoose.Types.ObjectId(artistId)
                }
            },
            {
                $lookup: {
                    from: "appointments",
                    localField: "appointment",
                    foreignField: "_id",
                    as: "appointment"
                }
            },
            {
                $unwind: "$appointment"
            },
            {
                $match: {
                    "appointment.date": date
                }
            },
            {
                $project: {
                    _id: 0,
                    artist: 1,
                    tokenNumber: 1,
                    startingTime: "$appointment.startTime",
                    endingTime: "$appointment.endTime"
                }
            }
        ]);

        if (queues && queues.length > 0) {
            queuesByArtist[artistId] = queues;
        }
    }

    console.log("queuesByArtist: ", queuesByArtist);

    return res.status(200).json(
        ApiResponse(
            200,
            queuesByArtist,
            "Queue fetched successfully"
        )
    );
});





export { addToQueue, deleteFromQueue, getQueue};
