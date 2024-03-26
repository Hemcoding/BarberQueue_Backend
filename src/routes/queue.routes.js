import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
        addToQueue,
        deleteFromQueue,
        getQueue
} from "../controllers/queue.controller.js";

const router = Router();

router.route("/add-to-queue").post(verifyJWT, addToQueue);
router.route("/delete-from-queue").delete(verifyJWT, deleteFromQueue);
router.route("/get-queue").post(getQueue);

export default router;
