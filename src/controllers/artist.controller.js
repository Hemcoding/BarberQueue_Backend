import { Artist } from "../models/artist.model.js";
import { createApiError } from "../utils/apiError.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const addArtist = AsyncHandler(async (req, res) => {
    const { artistName } = req.body;

    if (!artistName) {
        throw createApiError(400, "Artist name is required");
    }

    const artist = await Artist.create({
        artistName,
    });

    if (!artist) {
        throw createApiError(500, "An error occured while adding artist");
    }

    const createdArtist = await Artist.findById(artist?._id);

    if (!createdArtist) {
        throw createApiError(500, "An error occured while fetching artist");
    }

    return res
        .status(200)
        .json(ApiResponse(200, createdArtist, "Artist added successfully"));
});

const deleteArtist = AsyncHandler(async(req, res) => {
        const {id} = req.body

        if(!id){
                throw createApiError(400, "Id is required")
        }

        const artist = await Artist.deleteOne({_id: id})

        if(!artist){
                throw createApiError(500, "An error occured while deleting artist")
        }

        return res
        .status(200)
        .json(
                ApiResponse(
                        200,
                        {},
                        "artist deleted sccessfully"
                )
        )
        
})

const getArtist = AsyncHandler(async(req, res) => {
        const artists = await Artist.find();

        if(!artists){
                throw createApiError(500, "an error occured while fetching artists")
        }

        return res
        .status(200)
        .json(
                ApiResponse(
                        200,
                        artists,
                        "Artists fetched successfully"
                )
        )
})

export {
        addArtist,
        deleteArtist,
        getArtist
}