import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {addPoints, getLoyaltyPoints, redeemPoints} from "../controllers/loyalty.controller.js"

const router = Router();

router.route("/add-points").post(verifyJWT, addPoints)
router.route("/redeem-points").post(verifyJWT, redeemPoints)
router.route("/get-points").get(verifyJWT, getLoyaltyPoints)

export default router;