import { Router } from "express";
import {
  adminLogin,
  demoteToCustomer,
  promoteToAdmin,
  registerAdmin,
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
adminRouter.route("/register").post(upload.single("avatar"), registerAdmin);
adminRouter.route("/login").post(adminLogin);
adminRouter
  .route("/change-password")
  .post(verifyJwt, authorizeAdmin, changePassword);
adminRouter.route("/logout").post(loggedOutUser);
adminRouter.route("/refresh-access-token").post(refreshAccessToken);
adminRouter.route("/current-admin").get(verifyJwt, getCurrentUser);
adminRouter.use(verifyJwt, authorizeAdmin)
adminRouter
  .route("/update-account-details")
  .patch(verifyJwt, updateAccountDetails);
adminRouter
  .route("/avatar-update")
  .patch(verifyJwt, upload.single("avatar"), updateUserAvatar);
adminRouter.route("/promote-to-admin/:userId").post(promoteToAdmin);
adminRouter.route("/demote-to-customer/:userId").post(demoteToCustomer);

//Order and product
adminRouter.route("/orders").get(getAllOrder)
adminRouter.route("/orders/:orderId/update-status").patch(updateStatus);

export default adminRouter;
