import bcrypt from 'bcrypt'
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_TTL='30m';
const REFRESH_TOKEN_TTL=14*24*60*60*1000 //14 days

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
    }; 

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
    const {username,password} = req.body;

    if(!username || !password){
        return res.status(400).json({message:"Can not lack of username and password"});
    }
 
    const user = await User.findOne({username});

    if (!user){
        return res
        .status(401)
        .json({message:"Invalid username or password"});
    }
    //take harshed password from db to compare password input
    const passwordCorrect = await bcrypt.compare(password,user.hashedPassword);

    if (!passwordCorrect){
        return res
        .status(401)
        .json({message:"Invalid username or password"});
    }
    //if ok , create accessToken with JWT
    const accessToken = jwt.sign({userId:user._id},process.env.ACCESS_TOKEN_SECRET,{expiresIn:ACCESS_TOKEN_TTL});
    //create refreshToken
    const refreshToken = crypto.randomBytes(64).toString('hex');
    //create session to save refreshToken
    await Session.create({
        userID:user._id,
        refreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    })
    //return refreshToken into Cookie
    res.cookie('refreshToken',refreshToken,{
        httpOnly:true, // không thể bị truy cập bởi js từ client
        secure:true,//chỉ gửi cookie qua https
        sameSite:'None', //backend , frontend khác domain
        maxAge:REFRESH_TOKEN_TTL,
    });
    //return accessToken in response body
    return res.status(200).json({accessToken});
    } catch (error) {
    console.log('lỗi khi gọi signIn:',error);
    return res.sendStatus(500).json({message:"internal server error"})
    }
}
