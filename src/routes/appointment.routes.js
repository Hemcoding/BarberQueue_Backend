import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {bookAppointment, getAppointmentHistory, getUpcomingAppointments, getAppointment} from "../controllers/appointment.controller.js"

const router = Router();

router.route("/book-appointment").post(verifyJWT, bookAppointment)
router.route("/get-upcoming-appointment").get(verifyJWT, getUpcomingAppointments)
router.route("/get-appointment-history").get(verifyJWT, getAppointmentHistory)
router.route("/get-appointment").post(verifyJWT, getAppointment)

export default router;