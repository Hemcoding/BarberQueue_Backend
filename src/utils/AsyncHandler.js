// const asyncHandler = (requestHandler) => {
//         (req, res, next) => {
//                 Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
//         }
// }

// export {asyncHandler}

const AsyncHandler = (func) => async (req, res, next) => {
    try {
        await func(req, res, next);
    } catch (error) {
        console.log(error);
        res.status(error.code || 500).json({
            success: false,
            message: error.message,
        });
    }
};

export { AsyncHandler };
