import { cookieOptions } from "../config/constants.js";
import { SkatingSession } from "../models/skatting.model.js";
import { User } from "../models/user.model.js";
import { Booking } from "../models/booking.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { generateAccessAndRefreshTokens } from "../utils/generateAccessAndRefreshToken.js";

const registerAdmin = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if ([username, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All admin field required");
  }
  const existedAdmin = await User.findOne({ email });

  if (existedAdmin) throw new ApiError(404, "Admin already exists");

  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(404, "Avatar not found");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) throw new ApiError(404, "Avatar missing");

  const admin = await User.create({
    username,
    email,
    password,
    avatar: avatar.url,
    role: "admin",
  });

  const registeredAdmin = await User.findById(admin._id).select(
    "-password -refreshToken"
  );

  res.status(201).json(new ApiResponse(201, registeredAdmin, "Admin created"));
});

const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!(email || password)) throw new ApiError(400, "All field required");

  const existedUser = await User.findOne({ email });
  if (!existedUser) throw new ApiError(404, "User not found");

  const isValidPassword = await existedUser.isPasswordCorrect(password);
  if (!isValidPassword) throw new ApiError(400, "Invalid credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    existedUser?._id
  );
  const loggedInUser = await User.findById(existedUser._id).select(
    "-password -refreshToken"
  );
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, loggedInUser, "Admin logged in"));
});

const promoteToAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (user.role === "admin") {
    throw new ApiError(400, "Already admin");
  }
  user.role = "admin";
  user.save();
  return res.status(200).json(new ApiResponse(200, user, "Updated to admin"));
});

const demoteToCustomer = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "customer") throw new ApiError(400, "Already a customer");
  user.role = "customer";
  user.save();
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Demoted to customer"));
});

const createSkatingSession = asyncHandler(async (req, res) => {
  const { date, timeSlots, totalCapacity } = req.body;
  console.log(req.body);

  if (!date || !timeSlots || !totalCapacity) {
    throw new ApiError(400, "Date, timeSlots and totalCapacity are required");
  }

  // Check if session already exists for this date
  const existingSession = await SkatingSession.findOne({ date });
  if (existingSession) {
    throw new ApiError(400, "Session already exists for this date");
  }

  const session = await SkatingSession.create({
    date,
    timeSlots: timeSlots.map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxCapacity: slot.maxCapacity,
      price: slot.price,
      bookedSlots: 0,
      available: true,
    })),
    totalCapacity,
    availableSlots: totalCapacity,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, { session }, "Skating session created successfully")
    );
});

const getAllSessions = asyncHandler(async (req, res) => {
  const sessions = await SkatingSession.find().sort({ date: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, { sessions }, "Sessions fetched successfully"));
});

const getSessionById = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await SkatingSession.findById(sessionId);
  if (!session) {
    throw new ApiError(404, "Skating session not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { session }, "Session fetched successfully"));
});

const updateSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { timeSlots, totalCapacity, date } = req.body;

  const session = await SkatingSession.findById(sessionId);
  if (!session) {
    throw new ApiError(404, "Skating session not found");
  }

  const updatedSession = await SkatingSession.findByIdAndUpdate(
    sessionId,
    {
      $set: {
        ...(date && { date }),
        ...(timeSlots && {
          timeSlots: timeSlots.map((slot) => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
            maxCapacity: slot.maxCapacity,
            price: slot.price,
            bookedSlots: slot.bookedSlots || 0,
            available: slot.available !== undefined ? slot.available : true,
          })),
        }),
        ...(totalCapacity && { totalCapacity }),
      },
    },
    { new: true, runValidators: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { session: updatedSession },
        "Session updated successfully"
      )
    );
});

const deleteSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await SkatingSession.findById(sessionId);
  if (!session) {
    throw new ApiError(404, "Skating session not found");
  }

  // Check if there are any bookings for this session
  const existingBookings = await Booking.find({
    skatingSession: sessionId,
  });
  if (existingBookings.length > 0) {
    throw new ApiError(400, "Cannot delete session with existing bookings");
  }

  await SkatingSession.findByIdAndDelete(sessionId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Session deleted successfully"));
});

const updateTimeSlot = asyncHandler(async (req, res) => {
  const { sessionId, slotIndex } = req.params;
  const { startTime, endTime, maxCapacity, price, available } = req.body;

  const session = await SkatingSession.findById(sessionId);
  if (!session) {
    throw new ApiError(404, "Skating session not found");
  }

  if (slotIndex >= session.timeSlots.length) {
    throw new ApiError(400, "Invalid slot index");
  }

  // Update specific time slot
  if (startTime) session.timeSlots[slotIndex].startTime = startTime;
  if (endTime) session.timeSlots[slotIndex].endTime = endTime;
  if (maxCapacity) session.timeSlots[slotIndex].maxCapacity = maxCapacity;
  if (price) session.timeSlots[slotIndex].price = price;
  if (available !== undefined)
    session.timeSlots[slotIndex].available = available;

  await session.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { session }, "Time slot updated successfully"));
});

const getSessionAnalytics = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await SkatingSession.findById(sessionId);
  if (!session) {
    throw new ApiError(404, "Skating session not found");
  }

  const bookings = await Booking.find({ skatingSession: sessionId }).populate(
    "user",
    "username email"
  );

  const analytics = {
    totalBookings: bookings.length,
    confirmedBookings: bookings.filter((b) => b.status === "confirmed").length,
    completedBookings: bookings.filter((b) => b.status === "completed").length,
    noShowBookings: bookings.filter((b) => b.status === "no-show").length,
    cancelledBookings: bookings.filter((b) => b.status === "cancelled").length,
    totalRevenue: bookings
      .filter((b) => b.paymentStatus === "paid")
      .reduce((sum, booking) => sum + booking.totalAmount, 0),
    timeSlotWise: session.timeSlots.map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      booked: slot.bookedSlots,
      available: slot.maxCapacity - slot.bookedSlots,
      utilization:
        ((slot.bookedSlots / slot.maxCapacity) * 100).toFixed(2) + "%",
    })),
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { analytics },
        "Session analytics fetched successfully"
      )
    );
});
const getBannedUsers = asyncHandler(async (req, res) => {
  const bannedUsers = await User.find({ isBanned: true }).select(
    "username email banUntil banReason noShowCount"
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, { bannedUsers }, "Banned users fetched successfully")
    );
});
const unbanUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isBanned) {
    throw new ApiError(400, "User is not banned");
  }

  user.isBanned = false;
  user.banUntil = null;
  user.banReason = null;
  user.noShowCount = 0; // Reset strikes
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "User unbanned successfully"));
});
export {
  getBannedUsers,
  unbanUser,
  registerAdmin,
  adminLogin,
  promoteToAdmin,
  demoteToCustomer,
  createSkatingSession,
  getAllSessions,
  getSessionById,
  updateSession,
  deleteSession,
  updateTimeSlot,
  getSessionAnalytics,
};
