import express from 'express'
import { authMe, getDashboard, listUsers, createStaff, staffArea, customerHome, updateUser, deactivateUser } from '../controller/userController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js'
import { requireRole, requireAnyRole } from '../middlewares/roleMiddleware.js'

const router = express.Router();

router.get('/me', protectedRoute, authMe);
router.get('/dashboard', protectedRoute, getDashboard);

router.get('/', protectedRoute, requireRole('admin'), listUsers);
router.post('/admin/create-staff', protectedRoute, requireRole('admin'), createStaff);
router.put('/:id', protectedRoute, requireRole('admin'), updateUser);
router.post('/:id/deactivate', protectedRoute, requireRole('admin'), deactivateUser);

router.get('/staff/area', protectedRoute, requireAnyRole(['staff', 'admin']), staffArea);
router.get('/customer/home', protectedRoute, requireRole('customer'), customerHome);

export default router;