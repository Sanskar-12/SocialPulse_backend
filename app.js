import express from "express";
import { config } from "dotenv";
import postRoute from "./routes/post.js";
import userRoute from "./routes/user.js";
import cookieParser from "cookie-parser";

const app = express();

if (process.env.NODE_ENV !== "production") {
  config({ path: "./config/config.env" });
}

app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
  })
);
app.use(cookieParser());

app.use("/api/v1", postRoute);
app.use("/api/v1", userRoute);

export default app;
