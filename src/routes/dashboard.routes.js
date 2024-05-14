import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { cardData, getPopularServices, getWeeklyAppointmentCount, getYearlyEarnings } from "../controllers/dashboard.controller.js";

const router = Router();

router.route("/card-data").get(verifyJWT, cardData);
router.route("/get-earning-data").post(verifyJWT, getYearlyEarnings);
router.route("/get-weekly-appointment-count").get(verifyJWT, getWeeklyAppointmentCount);
router.route("/get-popular-services").get(verifyJWT, getPopularServices);

export default router;
