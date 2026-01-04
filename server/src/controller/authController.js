import bcrypt from 'bcrypt'
import User from '../models/User.js';

export const signUp = async (req,res)=>{
    try{
    const {username,password,email,firstName,lastName} = req.body

    if(!username || !password || !email || !firstName || !lastName){
        return res
        .status(400)
        .json({
            message:
            "Can not lack of username,password,email,firstName and lastName"
        });
        }
        ;
    //kiểm tra username tồn tại chưa
    const duplicate = await User.findOne({username});

    if (duplicate){
        return res.status(409).json({message:"username existed"})
    }

    // băm password

    const hashedPassword = await bcrypt.hash(password,10); // salt = 10

    //tạo user mới

    await User.create({
        username,
        hashedPassword,
        email,
        displayName:`${firstName} ${lastName}`,
    });
    
    return res.sendStatus(204);

    
    }catch(error){
        console.log('lỗi khi gọi signUp:',error);
        return res.sendStatus(500).json({message:"internal server error"})
    }
}

export const signIn = async (req,res) => {

try {
    // take input

    //take harshed password from db to compare password input

    //if ok , create accessToken with JWT

    //create session and save refreshToken

    //return refreshToken into Cookie, return accessToken into body


} catch (error) {
  


   
}
}
