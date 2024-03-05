import userRouter from "./routes/user.routes.js";
import offerRouter from "./routes/offer.routes.js";
import serviceRoute from "./routes/service.routes.js";
import staffRoute from "./routes/staff.routes.js"
import loyaltyRoute from "./routes/loyalty.routes.js"
import ShopTimeRoute from "./routes/shoptime.routes.js"
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors());

app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ limit: "5mb" }));
app.use(express.static("public"));
app.use(cookieParser());


app.use("/api/v1/users", userRouter);
app.use("/api/v1/offers", offerRouter);
app.use("/api/v1/services", serviceRoute)
app.use("/api/v1/staffs", staffRoute)
app.use("/api/v1/loyalty", loyaltyRoute)
app.use("/api/v1/shopTime", ShopTimeRoute)

export { app };
