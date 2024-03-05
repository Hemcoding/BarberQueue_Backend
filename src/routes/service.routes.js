import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {updateService, createService, deleteService, getService} from "../controllers/service.controller.js"

const router = Router();

router.route("/create-service").post(verifyJWT, createService)
router.route("/update-service").patch(verifyJWT, updateService)
router.route("/delete-service").delete(verifyJWT, deleteService)
router.route("/get-service").get(verifyJWT, getService)

export default router;