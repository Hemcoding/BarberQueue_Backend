import { Router } from "express";
import {
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory,
    generateOtp,
    logoutUser,
    registerUser,
    renewAccessToken,
    updateAccountDetails,
    updateUserProfilePicture,
    verifyOtpAndLogin,
    getOwnerDtails,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "profilePicture",
            maxCount: 1,
        }
        // {
        //     name: "coverImage",
        //     maxCount: 1,
        // },
    ]),
    registerUser
);
router.route("/generate-otp").post(generateOtp);
router.route("/otp-verification-login").post(verifyOtpAndLogin);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(renewAccessToken);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router
    .route("/update-profilepicture")
    .patch(verifyJWT, upload.single("profilePicture"), updateUserProfilePicture);
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watchHistory").get(verifyJWT, getWatchHistory);
router.route("/ownerDetails").get(verifyJWT, getOwnerDtails);
export default router;
