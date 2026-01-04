import mongoose from "mongoose";

const userSchemas= new mongoose.Schema({
    username:{
        type : String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true
    },

    hashedPassword:{ 
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
    },

    displayName:{
        type:String,
        required:true,
        trim:true,
    },

    avartarUrl:{
        type:String, //link cdn để hiện thị hình
    },

    avatarId:{
        type:String, // cloudinary public_id để xóa hình
    },

    bio:{
        type:String,
        maxlength:500, // tùy
    },

    phone:{ 
        type:String,
        sparse:true, // cho phép null,nhưng không được trùng
    },
    createdAt:{
        timestamp: true,
    },   
}
);
const User = mongoose.model("User" , userSchemas);
export default User;

    
    






