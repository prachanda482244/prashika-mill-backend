import { Booking } from "../models/booking.model.js";
import { SkatingSession } from "../models/skatting.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createBooking = asyncHandler(async (req, res, next) => {
  const { sessionId, timeSlot, numberOfSkates } = req.body;
  const userId = req.user._id;

  // Check if user is banned
  const user = await User.findById(userId);
  if (user.isBanned && user.banUntil > new Date()) {
    throw new ApiError(
      400,
      "You are banned from booking until " + user.banUntil
    );
  }

  // Check session availability
  const session = await SkatingSession.findById(sessionId);
  if (!session) {
    throw new ApiError(404, "Skating session not found");
  }

  const slot = session.timeSlots.find(
    (s) => s.startTime === timeSlot.startTime
  );

  if (!slot || !slot.available || slot.bookedSlots >= slot.maxCapacity) {
    throw new ApiError(400, "This time slot is not available");
  }

  // Calculate amount
  const totalAmount = slot.price * numberOfSkates;

  // Create booking
  const booking = await Booking.create({
    user: userId,
    skatingSession: sessionId,
    bookingDate: session.date,
    timeSlot,
    numberOfSkates,
    totalAmount,
  });

  // Update session booked slots
  slot.bookedSlots += numberOfSkates;
  if (slot.bookedSlots >= slot.maxCapacity) {
    slot.available = false;
  }
  await session.save();

  // Add to user's booking history
  user.bookingHistory.push(booking._id);
  await user.save();

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { booking },
        "Booking confirmed! Payment will be collected at venue."
      )
    );
});

const checkInBooking = asyncHandler(async (req, res, next) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId).populate("user");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.checkedIn) {
    throw new ApiError(400, "Booking already checked in");
  }

  // Mark as checked in and update payment
  booking.checkedIn = true;
  booking.checkedInAt = new Date();
  booking.paymentStatus = "paid";
  booking.status = "completed";
  await booking.save();

  // Reset no-show count on successful check-in
  const user = await User.findById(booking.user._id);
  user.noShowCount = 0;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Check-in successful and payment recorded"));
});

const handleNoShow = asyncHandler(async (req, res, next) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId).populate("user");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Mark as no-show
  booking.status = "no-show";
  await booking.save();

  // Update user no-show count
  const user = await User.findById(booking.user._id);
  user.noShowCount += 1;

  // Ban user if 3 consecutive no-shows
  if (user.noShowCount >= 3) {
    user.isBanned = true;
    const banDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    user.banUntil = new Date(Date.now() + banDuration);

    // Reset no-show count after ban
    user.noShowCount = 0;
  }

  await user.save();

  const message = user.isBanned
    ? `User banned until ${user.banUntil} due to 3 consecutive no-shows`
    : `No-show recorded. ${3 - user.noShowCount} strikes remaining before ban`;

  return res.status(200).json(new ApiResponse(200, { user }, message));
});

// Additional booking controllers
const getUserBookings = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const bookings = await Booking.find({ user: userId })
    .populate("skatingSession")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { bookings }, "User bookings fetched successfully")
    );
});

const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  const userId = req.user._id;

  const booking = await Booking.findOne({ _id: bookingId, user: userId });

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.status === "cancelled") {
    throw new ApiError(400, "Booking is already cancelled");
  }

  // Update session availability
  const session = await SkatingSession.findById(booking.skatingSession);
  const slot = session.timeSlots.find(
    (s) => s.startTime === booking.timeSlot.startTime
  );

  if (slot) {
    slot.bookedSlots = Math.max(0, slot.bookedSlots - booking.numberOfSkates);
    slot.available = true;
    await session.save();
  }

  // Update booking status
  booking.status = "cancelled";
  booking.paymentStatus = "cancelled";
  await booking.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { booking }, "Booking cancelled successfully"));
});

export {
  createBooking,
  checkInBooking,
  handleNoShow,
  getUserBookings,
  cancelBooking,
};
