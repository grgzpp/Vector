import express from 'express';
import TransactionController from '../controllers/TransactionController';
import { checkAuthMiddleware, checkLevelMiddleware } from '../middlewares/userMiddleware';
import { UserLevel } from '../models/User';
import { checkOwnershipMiddleware } from '../middlewares/transactionMiddleware';

const router = express.Router();
const transactionController: TransactionController = TransactionController.getInstance();

router
    .get('/:transactionId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.User, UserLevel.Autority, UserLevel.Admin]), checkOwnershipMiddleware(false), transactionController.getById) // Get transaction information
    .get('/history/:from-:to', checkAuthMiddleware, checkLevelMiddleware([UserLevel.User]), transactionController.getBetweenInterval(false)) // Get user transaction history from date to date
    .get('/history/:from-:to/:userId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Autority, UserLevel.Admin]), transactionController.getBetweenInterval(true)) // Get transaction history from date to date of one user
    .post('/', checkAuthMiddleware, checkLevelMiddleware([UserLevel.User]), transactionController.create); // Create a new Transaction

export default router;