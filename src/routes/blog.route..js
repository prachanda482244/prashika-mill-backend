import { Router } from "express";
import { addBlog, deleteBlog, getBlog, getSingleBlogDetail, updateBlog, updateBlogImage } from "../controllers/blog.controller.js";
import { authorizeAdmin, verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const blogRouter = Router()
blogRouter.route("/").get(getBlog)
blogRouter.route("/add-blog").post(upload.single("blogImage"),verifyJwt,authorizeAdmin,addBlog)
blogRouter.route("/get-single-blog/:blogId").get(getSingleBlogDetail)
blogRouter.route("/update-blog/:blogId").patch(verifyJwt,authorizeAdmin,updateBlog)
blogRouter
  .route("/blogImage-update/:blogId")
  .patch(upload.single("blogImage"),verifyJwt,authorizeAdmin, updateBlogImage);
blogRouter.route("/delete-blog/:blogId").delete(verifyJwt,authorizeAdmin,deleteBlog)

export default blogRouter