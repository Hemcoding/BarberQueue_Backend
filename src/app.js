import userRouter from "./routes/user.routes.js";
import offerRouter from "./routes/offer.routes.js";
import serviceRoute from "./routes/service.routes.js";
import staffRoute from "./routes/staff.routes.js";
import loyaltyRoute from "./routes/loyalty.routes.js";
import ShopTimeRoute from "./routes/shoptime.routes.js";
import ArtistRoute from "./routes/artist.routes.js";
import AppointmentRoute from "./routes/appointment.routes.js";
import QueueRoute from "./routes/queue.routes.js";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dashboard from "./routes/dashboard.routes.js";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ limit: "5mb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/offers", offerRouter);
app.use("/api/v1/services", serviceRoute);
app.use("/api/v1/staffs", staffRoute);
app.use("/api/v1/loyalty", loyaltyRoute);
app.use("/api/v1/shopTime", ShopTimeRoute);
app.use("/api/v1/artist", ArtistRoute);
app.use("/api/v1/appointment", AppointmentRoute);
app.use("/api/v1/queue", QueueRoute);
app.use("/api/v1/dashboard", dashboard);

export { app };
