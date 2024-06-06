import { Router } from "express";
import { addBlog, deleteBlog, getBlog, getSingleBlogDetail, updateBlog, updateBlogImage } from "../controllers/blog.controller.js";
import { authorizeAdmin, verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const blogRouter = Router()
blogRouter.use(verifyJwt,authorizeAdmin)
blogRouter.route("/").get(getBlog)
blogRouter.route("/add-blog").post(upload.single("blogImage"),addBlog)
blogRouter.route("/get-single-blog/:blogId").get(getSingleBlogDetail)
blogRouter.route("/update-blog/:blogId").patch(updateBlog)
blogRouter
  .route("/blogImage-update/:blogId")
  .patch(upload.single("blogImage"), updateBlogImage);
blogRouter.route("/delete-blog/:blogId").delete(deleteBlog)

export default blogRouter