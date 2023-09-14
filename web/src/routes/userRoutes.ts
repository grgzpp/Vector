import express from 'express';
import UserController from '../controllers/UserController';
import { checkAuthMiddleware, checkLevelMiddleware } from '../middlewares/userMiddleware';
import { UserLevel } from '../models/User';

const router = express.Router();
const userController: UserController = UserController.getInstance();

router
    .get('/', checkAuthMiddleware, userController.getById(false)) // Get user information
    .get('/:username', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Autority, UserLevel.Admin]), userController.getByUsername) // Get information of one user
    .post('/', userController.create(UserLevel.User)) // Create a new User
    .post('/autority', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Admin]), userController.create(UserLevel.Autority)) // Create a new Autority
    .put('/', checkAuthMiddleware, userController.updateById(false)) // Update user information
    .put('/:userId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Admin]), userController.updateById(true)) // Update information of one user
    .put('/otp/:userId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Admin]), userController.updateOtpSecretById) // Update OTP secret of one user
    .delete('/', checkAuthMiddleware, userController.deleteById(false)) // Soft-delete user
    .delete('/:userId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Admin]), userController.deleteById(true)); // Soft-delete one user

export default router;