import dayjs from "dayjs";
import { Appointment } from "../models/appointment.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { CreateApiError } from "../utils/CreateApiError.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";

const cardData = AsyncHandler(async (req, res) => {
    const count = await User.countDocuments();

    if (!count) {
        throw CreateApiError(500, "An error occured while fetching user count");
    }

    const today = dayjs().startOf("day");
    const appointments = await Appointment.find({
        date: today.toISOString(),
    });

    const todaysAppointmentCount =
        appointments.length > 0 ? appointments[0].count : 0;

    const bookedAppointments = await Appointment.find({
        date: today.toISOString(),
        status: "booked",
    });

    console.log("appp:", bookedAppointments);

    const bookedAppointmentCount =
        bookedAppointments.length > 0 ? bookedAppointments[0].count : 0;

    const lastMonthStart = dayjs().subtract(1, "month").startOf("month");
    const lastMonthEnd = dayjs().subtract(1, "month").endOf("month");
    const appointment = await Appointment.find({
        status: "confirmed",
        createdAt: {
            $gte: lastMonthStart.toDate(),
            $lte: lastMonthEnd.toDate(),
        },
    });
    console.log("appointment", appointment);
    const totalProfit = appointment.reduce(
        (acc, curr) => acc + curr.serviceCharges + curr.tax,
        0
    );

    console.log("total Profit:", totalProfit);

    if (!totalProfit) {
        throw CreateApiError(500, "An error occured while fetching profit");
    }

    return res.status(200).json(
        ApiResponse(200, {
            count,
            todaysAppointmentCount,
            bookedAppointmentCount,
            totalProfit,
        })
    );
});

const getYearlyEarnings = AsyncHandler(async (req, res) => {
    const { year } = req.body;

    if (!year || isNaN(year) || year < 0) {
        throw CreateApiError(400, "Invalid year provided");
    }

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    console.log("startDate: ", startDate, "endDate: ", endDate);

    const yearlyEarnings = await Appointment.aggregate([
        {
            $match: {
                status: "confirmed",
                date: { $gte: startDate, $lte: endDate },
            },
        },
        {
            $project: {
                _id: 0,
                date: { $dateFromString: { dateString: "$date" } }, 
                serviceCharges: 1,
            },
        },
        {
            $group: {
                _id: { $month: "$date" },
                totalServiceCharges: { $sum: "$serviceCharges" },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    console.log("yearlyEarning: ", yearlyEarnings);

    const yearlyEarningsData = Array(12).fill(0);

    yearlyEarnings.forEach((monthData) => {
        const month = monthData._id - 1; 
        yearlyEarningsData[month] = monthData.totalServiceCharges;
    });

    console.log("yearlyEarningData: ", yearlyEarningsData);

    return res.status(200).json(
        ApiResponse(200, {
            yearlyEarningsData,
        })
    );
});

const getWeeklyAppointmentCount = AsyncHandler(async (req, res) => {
        const currentDate = new Date();
    
        const firstDayOfWeek = new Date(currentDate);
        firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
        const lastDayOfWeek = new Date(currentDate);
        lastDayOfWeek.setDate(currentDate.getDate() + (6 - currentDate.getDay()));
    
        const appointmentsForCurrentWeek = await Appointment.find({
            date: { $gte: firstDayOfWeek, $lte: lastDayOfWeek },
            status: { $in: ["booked", "confirmed"] },
        });
    
        const weeklyCounts = Array(7).fill([0, 0]);
    
        appointmentsForCurrentWeek.forEach((appointment) => {
            const dayOfWeek = new Date(appointment.date).getDay();
            if (appointment.status === "booked") {
                weeklyCounts[dayOfWeek][0] += 1; 
            } else if (appointment.status === "confirmed") {
                weeklyCounts[dayOfWeek][1] += 1; 
        }});
    
        return res.status(200).json(
            ApiResponse(
                200,
                weeklyCounts,
                "Weekly appointment counts retrieved successfully"
            )
        );
    });
    
    
    

const getPopularServices = AsyncHandler(async (req, res) => {
    const confirmedAppointments = await Appointment.find({
        status: "confirmed",
    }).populate("services");

    const serviceCounts = {};

    confirmedAppointments.forEach((appointment) => {
        appointment.services.forEach((service) => {
            const serviceName = service.serviceName;
            serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
        });
    });

    const popularServices = Object.entries(serviceCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([serviceName, count]) => ({ serviceName, count }));

    return res
        .status(200)
        .json(
            ApiResponse(
                200,
                { popularServices },
                "Popular services retrieved successfully"
            )
        );
});

export { cardData, getYearlyEarnings, getWeeklyAppointmentCount, getPopularServices };
