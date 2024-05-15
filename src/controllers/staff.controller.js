import { Staff } from "../models/staff.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { CreateApiError } from "../utils/CreateApiError.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import {
    deleteFromCloudinary,
    uploadOnCloudinary,
} from "../utils/cloudinary.js";

const createStaff = AsyncHandler(async (req, res) => {
    const { name, specialistIn } = req.body;

    if (!name && !specialistIn) {
        throw CreateApiError(400, "All fields are required");
    }

    const existedStaff = await User.findOne({ name });

    if (existedStaff) {
        throw CreateApiError(409, "Staff member already exist");
    }

    const staffImageLocalPath = req.file?.path;

    if (!staffImageLocalPath) {
        throw CreateApiError(400, "Staff Image is required");
    }

    const staffImage = await uploadOnCloudinary(staffImageLocalPath);

    if (!staffImage) {
        throw CreateApiError(500, "Server error while uploading staff image");
    }

    const staffMember = await Staff.create({
        staffImage: staffImage.url,
        publicId: staffImage.public_id,
        name,
        specialistIn,
    });

    if (!staffMember) {
        throw CreateApiError(
            500,
            "An Error occured while creating staff member"
        );
    }

    const createdStaffMember = await Staff.findById(staffMember?._id);

    return res
        .status(200)
        .json(
            ApiResponse(
                200,
                createdStaffMember,
                "Staff member created successfully"
            )
        );
});

const deleteStaff = AsyncHandler(async (req, res) => {
    const { id } = req.body;
    console.log(id);

    const staffMember = await Staff.findById(id);

    if (!staffMember) {
        throw CreateApiError(400, "Satff member doesn't exist");
    }

    const deletedStaffMember = await Staff.deleteOne({ _id: id });

    if (!deletedStaffMember) {
        throw CreateApiError(500, "Error occured while deleting staff member");
    }

    return res
        .status(200)
        .json(ApiResponse(200, {}, "Staff member deleted successfully"));
});

const updateStaff = AsyncHandler(async (req, res) => {
    const { id, specialistIn } = req.body;

    console.log("specialistIn: ", specialistIn);

    let newStaffImage, staffMember;

    if (req.file) {
        const staffImageLocalPath = req.file?.path;

        if (!staffImageLocalPath) {
            throw CreateApiError(400, "Staff Image is required");
        }

        newStaffImage = await uploadOnCloudinary(staffImageLocalPath);
        console.log("new: ", newStaffImage);

        if (!newStaffImage) {
            throw CreateApiError(
                500,
                "Server error while uploading staff image"
            );
        }

        if (newStaffImage) {
            const oldStaffMember = await Staff.findById(id);
            console.log(oldStaffMember);

            const imageURL = oldStaffMember.publicId;
            const response = await deleteFromCloudinary(imageURL);
            console.log(response);
        }
        staffMember = await Staff.findByIdAndUpdate(
            id,
            {
                $set: {
                    staffImage: newStaffImage.url,
                    publicId: newStaffImage.public_id,
                },
            },
            { new: true }
        );
    }
    staffMember = await Staff.findByIdAndUpdate(
        id,
        {
            $set: {
                specialistIn,
            },
        },
        { new: true }
    );

    return res
        .status(200)
        .json(
            ApiResponse(200, staffMember, "Staff details updated successfully")
        );
});

const getStaff = AsyncHandler(async (req, res) => {
    const staff = await Staff.find();

    if (!staff) {
        throw CreateApiError(500, "An error occured while fetching staff");
    }

    return res
        .status(200)
        .json(ApiResponse(200, staff, "Staff fetched successfully"));
});

export { createStaff, deleteStaff, updateStaff, getStaff };
