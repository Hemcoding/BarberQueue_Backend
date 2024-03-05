import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createOffer, getOffer, updateOffer } from "../controllers/offer.controller.js";

const router = Router();

router.route("/update-offer").patch(
        verifyJWT,
        upload.single("offerImage"),
        updateOffer
    );
router.route("/create-offer").post(verifyJWT,upload.single("offerImage") ,createOffer)
router.route("/get-offers").get(verifyJWT, getOffer);

export default router;