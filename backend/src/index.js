import express, { urlencoded } from "express";
import { PORT } from "./config/constants.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectToDb from "./db/connect.js";
const app = express();
connectToDb();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
