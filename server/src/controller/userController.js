export const authMe = async (req,res) => {
    try {
        return res.status(200).json({message:`Hello`});
    } catch (error) {
        console.log('lỗi khi gọi authMe:',error);
        return res.sendStatus(500).json({message:"internal server error"})
    }
}