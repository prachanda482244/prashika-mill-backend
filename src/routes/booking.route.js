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
import {
  getAllSessions,
  getSessionById,
} from "../controllers/admin.controller.js";

const router = Router();

router.use(verifyJwt);
router.post("/create", createBooking);

router.get("/my-bookings", getUserBookings);
router.post("/cancel", cancelBooking);
router.route("/sessions").get(getAllSessions);
router.route("/sessions/:sessionId").get(getSessionById);
export default router;
