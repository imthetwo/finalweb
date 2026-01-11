import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protectedRoute = async (req, res, next) => {
    try {

        //lấy token từ header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];// bearer <token>

        if (!token) {
            return res.status(401).json({ message: "Không tìm thấy access token" });
        }
        //xác nhận token hợp lệ
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                console.error;
                return res.status(403).json({ message: "Access token không hợp lệ hoặc đã hết hạn" });
            }
            // tìm user
            const user = await User.findById(decoded.userId).select('-hashedPassword');
            if (!user) {
                return res.status(404).json({ message: "Không tìm thấy người dùng" });
            }
            //trả user về trong req
            req.user = user;
            next();
        });
    } catch (error) {
        console.log('lỗi trong protectedRoute:', error);
        return res.sendStatus(500).json({ message: "internal server error" })
    }
};
