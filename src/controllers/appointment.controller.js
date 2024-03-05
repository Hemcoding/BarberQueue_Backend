import { Queue } from "../models/queue.model";
import { User } from "../models/user.model";
import { createApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";

const shopSchedule = {
    openingTime: "07:00",
    closingTime: "21:00",
    lunchBreakStart: "13:00",
    lunchBreakEnd: "14:00",
};

const bookAppointment = asyncHandler(async (req, res) => {
    // check customer is booking or admin booking by req.user._id
    // customer is set walk-in customer as False
    // get required data for booking from req.body
    // validate required field
    //

    const user = await User.findById(req.user?._id);

    const { role } = user;

    let isWalkInCustomer, startTime, endTime;

    if (role === "admin") {
        isWalkInCustomer = true;
    }

    isWalkInCustomer = false;

    const { date, service, paymentType, artist } = req.body;

    if (!date && !service && !paymentType && !artist) {
        throw createApiError(400, "All fields are required");
    }

    const lastAppointment = await Queue.findOne({}).sort({ createdAt: -1 });

    const previousAppointmentEndTime = lastAppointment.endTime;

    const currentDate = new Date();

//     const currentTime = currentDate.getHours() + ":" + currentDate.getMinutes();
    const currentTime = currentDate.getTime();

    if(currentTime === previousAppointmentEndTime){
        startTime = currentTime
    }else if (currentTime > previousAppointmentEndTime) {
        startTime = currentTime
    } else {
        startTime = previousAppointmentEndTime
    }

    endTime = startTime + 

});