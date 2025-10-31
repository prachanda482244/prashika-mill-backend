import { Booking } from "../models/booking.model.js";
import { SkatingSession } from "../models/skatting.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// User creates a booking
const createBooking = asyncHandler(async (req, res) => {
  const { sessionId, timeSlot, numberOfSkates, address } = req.body;
  const userId = req.user._id;

  // Check if user is banned
  const user = await User.findById(userId);
  if (user.isBanned && user.banUntil > new Date()) {
    throw new ApiError(
      400,
      `You are banned from booking until ${user.banUntil.toDateString()}`
    );
  }

  // Check session availability
  const session = await SkatingSession.findById(sessionId);
  if (!session) {
    throw new ApiError(404, "Skating session not found");
  }

  // Find the specific time slot
  const slot = session.timeSlots.find(
    (s) => s.startTime === timeSlot.startTime && s.endTime === timeSlot.endTime
  );

  if (!slot) {
    throw new ApiError(404, "Time slot not found");
  }

  if (!slot.available) {
    throw new ApiError(400, "This time slot is not available");
  }

  if (slot.bookedSlots + numberOfSkates > slot.maxCapacity) {
    throw new ApiError(
      400,
      `Only ${
        slot.maxCapacity - slot.bookedSlots
      } slots available in this time slot`
    );
  }

  // Calculate total amount
  const totalAmount = slot.price * numberOfSkates;

  // Create booking
  const booking = await Booking.create({
    user: userId,
    skatingSession: sessionId,
    bookingDate: session.date,
    timeSlot: {
      startTime: slot.startTime,
      endTime: slot.endTime,
    },
    numberOfSkates,
    address,
    totalAmount,
    status: "confirmed",
    paymentStatus: "pending",
  });

  // Update session booked slots
  slot.bookedSlots += numberOfSkates;

  // Update session available slots
  session.availableSlots =
    session.totalCapacity -
    session.timeSlots.reduce((total, s) => total + s.bookedSlots, 0);

  // Check if time slot is fully booked
  if (slot.bookedSlots >= slot.maxCapacity) {
    slot.available = false;
  }

  await session.save();

  // Add to user's booking history
  user.bookingHistory.push(booking._id);
  await user.save();

  // Populate booking for response
  const populatedBooking = await Booking.findById(booking._id)
    .populate("user", "username email")
    .populate("skatingSession", "date timeSlots");

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { booking: populatedBooking },
        "Booking confirmed successfully! Payment will be collected at venue."
      )
    );
});

// User gets their bookings
const getUserBookings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, page = 1, limit = 10 } = req.query;

  const filter = { user: userId };
  if (status) filter.status = status;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      {
        path: "skatingSession",
        select: "date timeSlots totalCapacity availableSlots",
      },
    ],
  };

  const bookings = await Booking.find(filter)
    .populate("skatingSession", "date timeSlots totalCapacity availableSlots")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Booking.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalBookings: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
      "User bookings fetched successfully"
    )
  );
});

// User cancels booking
const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  const userId = req.user._id;

  const booking = await Booking.findOne({ _id: bookingId, user: userId })
    .populate("skatingSession")
    .populate("user");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.status === "cancelled") {
    throw new ApiError(400, "Booking is already cancelled");
  }

  if (booking.status === "completed") {
    throw new ApiError(400, "Cannot cancel a completed booking");
  }

  // Update session availability
  const session = await SkatingSession.findById(booking.skatingSession._id);
  const slot = session.timeSlots.find(
    (s) =>
      s.startTime === booking.timeSlot.startTime &&
      s.endTime === booking.timeSlot.endTime
  );

  if (slot) {
    slot.bookedSlots = Math.max(0, slot.bookedSlots - booking.numberOfSkates);
    slot.available = true;

    // Update session available slots
    session.availableSlots =
      session.totalCapacity -
      session.timeSlots.reduce((total, s) => total + s.bookedSlots, 0);
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

// Admin: Check-in booking
const checkInBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId)
    .populate("user")
    .populate("skatingSession");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.checkedIn) {
    throw new ApiError(400, "Booking already checked in");
  }

  if (booking.status === "cancelled") {
    throw new ApiError(400, "Cannot check-in a cancelled booking");
  }

  // Mark as checked in and update payment
  booking.checkedIn = true;
  booking.checkedInAt = new Date();
  booking.paymentStatus = "paid";
  booking.status = "completed";

  await booking.save();

  // Reset no-show count and add loyalty points on successful check-in
  const user = await User.findById(booking.user._id);
  user.noShowCount = 0;
  user.loyaltyPoints = (user.loyaltyPoints || 0) + 1;
  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { booking },
        "Check-in successful and payment recorded"
      )
    );
});

// Admin: Mark as no-show
const handleNoShow = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId)
    .populate("user")
    .populate("skatingSession");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.status === "completed") {
    throw new ApiError(400, "Cannot mark completed booking as no-show");
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
    user.banReason = "no-show";
    const banDuration = 30 * 24 * 60 * 60 * 1000; // 30 days
    user.banUntil = new Date(Date.now() + banDuration);

    // Reset no-show count after ban
    user.noShowCount = 0;
  }

  await user.save();

  const message = user.isBanned
    ? `User banned until ${user.banUntil.toDateString()} due to 3 consecutive no-shows`
    : `No-show recorded. ${3 - user.noShowCount} strikes remaining before ban`;

  return res.status(200).json(new ApiResponse(200, { user, booking }, message));
});

// Admin: Get all bookings
const getAllBookings = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    paymentStatus,
    sessionId,
    userId,
    date,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build filter object
  const filter = {};

  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (sessionId) filter.skatingSession = sessionId;
  if (userId) filter.user = userId;
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    filter.bookingDate = { $gte: startDate, $lt: endDate };
  }

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Execute query with pagination
  const bookings = await Booking.find(filter)
    .populate("user", "username email avatar noShowCount isBanned")
    .populate("skatingSession", "date timeSlots totalCapacity availableSlots")
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const totalCount = await Booking.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalBookings: totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1,
        },
      },
      "All bookings fetched successfully"
    )
  );
});

// Admin: Get bookings by session
const getBookingsBySession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { status } = req.query;

  // Validate session exists
  const session = await SkatingSession.findById(sessionId);
  if (!session) {
    throw new ApiError(404, "Skating session not found");
  }

  const filter = { skatingSession: sessionId };
  if (status) filter.status = status;

  const bookings = await Booking.find(filter)
    .populate("user", "username email phone noShowCount loyaltyPoints")
    .populate("skatingSession", "date timeSlots totalCapacity availableSlots")
    .sort({ createdAt: -1 });

  // Calculate session statistics
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(
    (b) => b.status === "confirmed"
  ).length;
  const completedBookings = bookings.filter(
    (b) => b.status === "completed"
  ).length;
  const cancelledBookings = bookings.filter(
    (b) => b.status === "cancelled"
  ).length;
  const noShowBookings = bookings.filter((b) => b.status === "no-show").length;

  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum, booking) => sum + booking.totalAmount, 0);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        session: {
          _id: session._id,
          date: session.date,
          totalCapacity: session.totalCapacity,
          availableSlots: session.availableSlots,
          timeSlots: session.timeSlots,
        },
        bookings,
        statistics: {
          totalBookings,
          confirmedBookings,
          completedBookings,
          cancelledBookings,
          noShowBookings,
          totalRevenue,
        },
      },
      `Bookings for session fetched successfully`
    )
  );
});

// Admin: Update booking status
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { status, paymentStatus } = req.body;

  const booking = await Booking.findById(bookingId)
    .populate("user")
    .populate("skatingSession");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Validate status transition
  const allowedStatuses = ["confirmed", "cancelled", "completed", "no-show"];
  if (status && !allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  // Update fields
  if (status) booking.status = status;
  if (paymentStatus) booking.paymentStatus = paymentStatus;

  await booking.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, { booking }, "Booking status updated successfully")
    );
});

export {
  createBooking,
  getUserBookings,
  cancelBooking,
  checkInBooking,
  handleNoShow,
  getAllBookings,
  getBookingsBySession,
  updateBookingStatus,
};
