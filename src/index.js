import express, { urlencoded } from "express";
import { PORT } from "./config/constants.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectToDb from "./db/connect.js";

// Routes
import userRouter from "./routes/user.route.js";
import adminRouter from "./routes/admin.route.js";
import productRouter from "./routes/product.route.js";
import dashboardRouter from "./routes/dashboard.route.js";
import cartRouter from "./routes/cart.route.js";
import blogRouter from "./routes/blog.route..js";
import orderRouter from "./routes/order.route.js";
import morgan from "morgan";
import searchRouter from "./routes/search.route.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { ApiError } from "./utils/ApiErrors.js";

const app = express();
connectToDb();

app.use(
  cors({
    // origin: process.env.CORS_ORIGIN || "*",
    // origin: "https://prashika-mel-frontend.vercel.app",
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(urlencoded({ extended: true, limit: "20mb" }));
app.use(express.static("public"));
app.use(morgan("dev"));


app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/blog", blogRouter);
app.use("/api/v1/search", searchRouter);
app.get("/testing", (req, res) => {
  res.status(200).json({
    success: true,
    data: [
      {
        name: "test success",
      },
    ],
    message: "Data fetched",
  });
});
app.use("*", (req, res, next) => {
  next(new ApiError(404, `Cannot find ${req.method}:${req.originalUrl}  on this server!`));
})
app.use(errorHandler)
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
