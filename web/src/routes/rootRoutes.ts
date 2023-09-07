import express from 'express';
import UserController, { BalanceAction } from '../controllers/UserController';
import { checkAuthMiddleware, checkLevelMiddleware } from '../middlewares/userMiddleware';
import { UserLevel } from '../models/User';

const router = express.Router();
const userController: UserController = UserController.getInstance();

router
    .post('/login', userController.login)
    .get('/balance', checkAuthMiddleware, checkLevelMiddleware([UserLevel.User]), userController.getBalance(false))
    .get('/balance/:userId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Autority, UserLevel.Admin]), userController.getBalance(true))
    .put('/balance/:userId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Admin]), userController.updateBalance(BalanceAction.Set))
    .put('/deposit/:userId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Admin]), userController.updateBalance(BalanceAction.Deposit))
    .put('/withdraw/:userId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Admin]), userController.updateBalance(BalanceAction.Withdraw));

export default router;