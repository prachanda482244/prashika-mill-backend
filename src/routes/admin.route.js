import { Router } from "express";
import {
  adminLogin,
  demoteToCustomer,
  promoteToAdmin,
  registerAdmin,
  createSkatingSession,
  getAllSessions,
  getSessionById,
  updateSession,
  deleteSession,
  updateTimeSlot,
  getSessionAnalytics,
  getBannedUsers,
  unbanUser,
} from "../controllers/admin.controller.js";
import { authorizeAdmin, verifyJwt } from "../middlewares/auth.middleware.js";
import {
  changePassword,
  getCurrentUser,
  loggedOutUser,
  refreshAccessToken,
  updateAccountDetails,
  updateUserAvatar,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { getAllOrder, updateStatus } from "../controllers/order.controller.js";

const adminRouter = Router();

// =====================================
// PUBLIC ADMIN ROUTES
// =====================================
adminRouter.route("/register").post(upload.single("avatar"), registerAdmin);
adminRouter.route("/login").post(adminLogin);

// =====================================
// PROTECTED ADMIN ROUTES
// =====================================
adminRouter.route("/refresh-access-token").post(refreshAccessToken);

// Apply admin middleware to all routes below
adminRouter.use(verifyJwt, authorizeAdmin);

// Admin Profile Routes
adminRouter.route("/change-password").post(changePassword);
adminRouter.route("/logout").post(loggedOutUser);
adminRouter.route("/current-admin").get(getCurrentUser);
adminRouter.route("/update-account-details").patch(updateAccountDetails);
adminRouter
  .route("/avatar-update")
  .patch(upload.single("avatar"), updateUserAvatar);

// User Management Routes
adminRouter.route("/promote-to-admin/:userId").post(promoteToAdmin);
adminRouter.route("/demote-to-customer/:userId").post(demoteToCustomer);

// Order Management Routes
adminRouter.route("/orders").get(getAllOrder);
adminRouter.route("/orders/:orderId/update-status").patch(updateStatus);

// =====================================
// SKATING SESSION MANAGEMENT ROUTES
// =====================================

// Create new skating session
adminRouter.route("/sessions/create").post(createSkatingSession);
adminRouter.route("/banned-users").get(getBannedUsers);
adminRouter.route("/unban-user/:userId").post(unbanUser);
// Get all sessions

// Get session by ID
adminRouter
  .route("/sessions/:sessionId")
  .get(getSessionById)
  .put(updateSession)
  .delete(deleteSession);

// Update specific time slot in a session
adminRouter
  .route("/sessions/:sessionId/slots/:slotIndex")
  .patch(updateTimeSlot);

// Get session analytics
adminRouter.route("/sessions/:sessionId/analytics").get(getSessionAnalytics);

export default adminRouter;
