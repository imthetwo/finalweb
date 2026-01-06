import express from 'express'
import { authMe } from '../controller/userController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/me', protectedRoute, authMe);

export default router;