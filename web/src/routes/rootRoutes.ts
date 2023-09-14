import express from 'express';
import UserController, { BalanceAction } from '../controllers/UserController';
import { checkAuthMiddleware, checkLevelMiddleware } from '../middlewares/userMiddleware';
import { UserLevel } from '../models/User';

const router = express.Router();
const userController: UserController = UserController.getInstance();

router
    .post('/login', userController.login) // User login
    .get('/balance', checkAuthMiddleware, checkLevelMiddleware([UserLevel.User]), userController.getBalance(false)) // Get user balance
    .get('/balance/:userId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Autority, UserLevel.Admin]), userController.getBalance(true)) // Get balance of one user
    .put('/balance/:userId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Admin]), userController.updateBalance(BalanceAction.Set)) // Set balance of one user
    .put('/deposit/:userId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Admin]), userController.updateBalance(BalanceAction.Deposit)) // Increment balance of one user
    .put('/withdraw/:userId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Admin]), userController.updateBalance(BalanceAction.Withdraw)); // Decrement balance of one user

export default router;