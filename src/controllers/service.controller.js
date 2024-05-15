import { Service } from "../models/service.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { CreateApiError } from "../utils/CreateApiError.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";

const createService = AsyncHandler(async(req,res) => {
    const {serviceName, duration, price} = req.body

    const existedService = await Service.findOne({
        serviceName
    })

    if(existedService){
        throw CreateApiError(409, "service already exist")
    }

    console.log(serviceName, duration, price);

    if(!serviceName && !duration && !price){
        throw CreateApiError(400, "All fields are required")
    }

    const service = await Service.create({
        serviceName,
        duration,
        price
    })

    if(!service){
        throw CreateApiError(500, "Error occure while creating service")
    }

    const createdService = await Service.findById(service._id)

    return res
    .status(200)
    .json(
        ApiResponse(
                200,
                createdService,
                "Service created Successfully"
        )
    )

})

const updateService =AsyncHandler(async(req,res)=>{
        const{id, serviceName, duration, price} = req.body

        const service = await Service.findByIdAndUpdate(
                id,
                {
                        serviceName,
                        duration,
                        price
                }
                )

                if(!service){
                        throw CreateApiError(500, "Some error is occured while updating service")
                }

                return res
                .status(200)
                .json(
                        ApiResponse(
                                200,
                                {},
                                "Service updated successfully"
                        )
                )
})

const deleteService = AsyncHandler(async(req,res) => {
        const {id} = req.body
        console.log("serviceid: ",id);

        const service = await Service.findById(id)

        console.log(service);

        if(!service){
                throw CreateApiError(400, "service doesn't exist")
        }
        
        const deletedService = await Service.deleteOne({_id: id})

        if(!deletedService){
                throw CreateApiError(500, "Error occured while deleting service")
        }

        return res
        .status(200)
        .json(
                ApiResponse(
                        200,
                        {},
                        "Service deleted successfully"
                )
        )
})

const getService = AsyncHandler(async(req, res) => {
        const services = await Service.find()

        if(!services){
                throw CreateApiError(500, "Error occured while fetching services")
        }

        return res
        .status(200)
        .json(
                ApiResponse(
                        200,
                        services,
                        "services fetched successfully"
                )
        )
})

export {
        createService,
        updateService,
        deleteService,
        getService
}