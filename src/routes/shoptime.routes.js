import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { setShopTime, updateShopTime } from "../controllers/shoptime.controller.js";

const router = Router();

router.route("/set-shop-time").post(verifyJWT, setShopTime)
router.route("/update-shop-time").patch(verifyJWT, updateShopTime)

export default router;