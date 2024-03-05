import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createStaff, deleteStaff, getStaff, updateStaff } from "../controllers/staff.controller.js";

const router = Router();

router.route("/create-staff").post(verifyJWT,upload.single("staffImage") ,createStaff)
router.route("/delete-staff").delete(verifyJWT, deleteStaff)
router.route("/update-staff").patch(
        verifyJWT,
        upload.single("staffImage"),
        updateStaff
    );
router.route("/get-staff").get(verifyJWT, getStaff);

export default router;