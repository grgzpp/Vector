import express from 'express';
import TransactionController from '../controllers/TransactionController';
import { checkAuthMiddleware, checkLevelMiddleware } from '../middlewares/userMiddleware';
import { UserLevel } from '../models/User';
import { checkOwnershipMiddleware } from '../middlewares/transactionMiddleware';

const router = express.Router();
const transactionController: TransactionController = TransactionController.getInstance();

router
    .get('/:transactionId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.User, UserLevel.Autority, UserLevel.Admin]), checkOwnershipMiddleware(false), transactionController.getById)
    .get('/history/:from-:to', checkAuthMiddleware, checkLevelMiddleware([UserLevel.User]), transactionController.getBetweenInterval(false))
    .get('/history/:from-:to/:userId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Autority, UserLevel.Admin]), transactionController.getBetweenInterval(true))
    .post('/', checkAuthMiddleware, checkLevelMiddleware([UserLevel.User]), transactionController.create);

export default router;