import { Appointment } from "../models/appointment.model.js";
import { Queue } from "../models/queue.model.js";
import { createApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Artist } from '../models/artist.model.js'
import {ApiResponse} from "../utils/ApiResponse.js"

const generateToken = async (appointment) => {
    const cDate = new Date();

    console.log("appointment: ", appointment)
    const { date, artistId } = appointment;

    console.log("date: ", date, "artistId: ", artistId)

    const [, , day] = date.split("-");

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

     const token = `BQ-${day}${number}`

     console.log("token: ", token)

     return token
};

const addToQueue = asyncHandler(async (req, res) => {
    const { id } = req.body;

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

    const artist = await Artist.findById(appointment?.artistId)

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
    const queue = await Queue.find()

    if(!queue){
        throw createApiError(500, "An error occured while fetching queue")
    }

    return res
    .status(200)
    .json(
        ApiResponse(
            200,
            queue,
            "Queue fetched successfully"
        )
    )
})

export { addToQueue, deleteFromQueue, getQueue};
