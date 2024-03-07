import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
        addArtist,
        deleteArtist,
        getArtist
} from "../controllers/artist.controller.js";

const router = Router();

router.route("/add-artist").post(verifyJWT, addArtist);
router.route("/delete-artist").delete(verifyJWT, deleteArtist);
router.route("/get-artist").get(getArtist);

export default router;
