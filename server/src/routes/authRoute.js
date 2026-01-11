import express from 'express'
import { signUp } from '../controller/authController.js';
import { signIn } from '../controller/authController.js';
import { logOut } from '../controller/authController.js';

const router = express.Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/logout", logOut);

export default router;
