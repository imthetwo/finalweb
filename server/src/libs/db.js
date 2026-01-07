import mongoose from "mongoose";

export const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING)
        console.log('Connected Database')
    } catch (error){
        console.log('Can not connect to DB:',error)
        process.exit(1);
    }
}