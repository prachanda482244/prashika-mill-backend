// routes/bookingRoutes.js
import { Router } from "express";
import {
  createBooking,
  checkInBooking,
  handleNoShow,
  getUserBookings,
  cancelBooking,
} from "../controllers/booking.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getAllSessions } from "../controllers/admin.controller.js";

const router = Router();

router.use(verifyJwt);
router.post("/create", createBooking);
router.post("/checkin", checkInBooking);
router.post("/no-show", handleNoShow);
router.get("/my-bookings", getUserBookings);
router.post("/cancel", cancelBooking);
router.route("/sessions").get(getAllSessions);

export default router;
