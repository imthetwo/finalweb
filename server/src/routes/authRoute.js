import express from 'express'
import { signUp } from '../controller/authController.js';

const router = express.Router();

router.post("/signup",signUp);
router.post("/login",signIn);



export default router;
