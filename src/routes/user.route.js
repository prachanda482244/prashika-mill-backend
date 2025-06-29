import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  getCurrentUser,
  loggedOutUser,
  loginUser,
  refreshAccessToken,
  registerUser,
  resetPassword,
  updateAccountDetails,
  updateUserAvatar,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const userRouter = Router();
userRouter.route("/register").post(upload.single("avatar"), registerUser);
userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(loggedOutUser);
userRouter.route("/refresh-access-token").post(refreshAccessToken);
userRouter.route("/change-password").post(verifyJwt, changePassword);
userRouter.route("/me").get(verifyJwt, getCurrentUser);
userRouter
  .route("/update-account-details")
  .patch(verifyJwt, updateAccountDetails);
userRouter
  .route("/avatar-update")
  .patch(verifyJwt, upload.single("avatar"), updateUserAvatar);
userRouter.route("/forgot-password").post(forgotPassword)
userRouter.route("/reset-password/:resetToken").post(resetPassword)

export default userRouter;
