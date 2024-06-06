import { Schema,model } from "mongoose";
const blogSchema = new Schema({
      user:{
            type:Schema.Types.ObjectId,
            ref:"User"
      },
      title:{
            type:String,
            required:true
      },
      description:{
            type:String,
            required:true
      },
      blogImage:{
            type:String
      }
},{timestamps:true})

export const Blog = model("blog",blogSchema)