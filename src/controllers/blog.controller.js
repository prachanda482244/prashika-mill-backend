import {  Blog } from "../models/blog.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const addBlog = asyncHandler(async(req,res)=>{
      const {title,description} = req.body
      if([title,description].some((field)=>field?.trim()==='')){
            throw new ApiError(400,'All field required')
      }
  const blogImageLocalPath = req.file?.path;
  if (!blogImageLocalPath) {
      throw new ApiError(404, "Blog image not found");
    }
    const blogImage = await uploadOnCloudinary(blogImageLocalPath);

    if (!blogImage) throw new ApiError(404, "Blog image missing");
  
      if(!req.user.role=="admin") throw new ApiError(402,"Unauthorized ")
      
            const blog = await Blog.create({
                  user:req.user._id,
                  title,
                  description,
                  blogImage:blogImage.url
            })
           if(!blog) throw new ApiError(400,"Failed to create a blog") 
      return res.status(200).json(new ApiResponse(200,blog,"Blog created Successfully"))
})
const getBlog = asyncHandler(async(_,res)=>{
      const blog = await Blog.find()
      if(!blog) throw new ApiError(404,"Blog not found")
       return res.status(200).json(new ApiResponse(200,blog,"Blog details"))
})

const getSingleBlogDetail = asyncHandler(async(req,res)=>{
      const {blogId} = req.params
      if(!blogId) throw new ApiError(404,"Blog id not found")
      
      const blog = await Blog.findById(blogId)
      if(!blog) throw new ApiError(404,"Blog not found")
            return res.status(200).json(new ApiResponse(200,blog,"Single blog details"))
})

const updateBlog = asyncHandler(async(req,res)=>{
      const {blogId} = req.params
      if(!blogId) throw new ApiError(404,"Blog id not found")
       const {title,description}= req.body
      const blog = await Blog.findByIdAndUpdate(blogId,{
            $set:{
                  title,
                  description
            }
      },
      {
            new:true
      })    
      if(!blog) throw new ApiError(400,"Unable to update blog") 
      return res.status(200).json(new ApiResponse(200,blog,"Blog updated"))
})
const updateBlogImage = asyncHandler(async(req,res)=>{
      const blogLocalPath = req.file?.path;
      const{blogId} = req.params
      if (!blogLocalPath) {
        throw new ApiError(400, "Blog file is missing");
      }
      const blogImage = await uploadOnCloudinary(blogLocalPath);
      if (!blogImage.url) {
        throw new ApiError(400, "Error while uploading on avatar");
      }
      const blog = await Blog.findByIdAndUpdate(
        blogId,
        {
          $set: {
            blogImage: blogImage.url,
          },
      })
      if(!blog)throw new ApiError(400,"Error to update the blog image")

        return res.status(200).json(new ApiResponse(200,blog,'Blog image updated successfully'))    
})

const deleteBlog = asyncHandler(async(req,res)=>{
      const {blogId} = req.params
      if(!blogId) throw new ApiError(404,"Blog id not found")
const blog = await Blog.findByIdAndDelete(blogId)     
      if(!blog) throw new ApiError(400,"Unable to delete blog") 
      return res.status(200).json(new ApiResponse(200,{},"Blog delete"))
})
export {addBlog,getBlog,getSingleBlogDetail,updateBlog,updateBlogImage,deleteBlog}