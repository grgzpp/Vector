import express from 'express';
import EventController from '../controllers/EventController';
import { checkAuthMiddleware, checkLevelMiddleware } from '../middlewares/userMiddleware';
import { checkOwnershipMiddleware } from '../middlewares/transactionMiddleware';
import { UserLevel } from '../models/User';

const router = express.Router();
const eventController: EventController = EventController.getInstance();

router
    .get('/:transactionId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.User, UserLevel.Autority, UserLevel.Admin]), checkOwnershipMiddleware(false), eventController.getEventsByTransactionId)
    .post('/pay/:transactionId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.User]), eventController.payByTransactionId)
    .post('/tax/:transactionId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Autority, UserLevel.Admin]), eventController.taxByTransactionId)
    .post('/return/:transactionId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.User]), checkOwnershipMiddleware(), eventController.returnByTransactionId)
    .post('/delete/:transactionId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.User, UserLevel.Admin]), checkOwnershipMiddleware(), eventController.deleteByTransactionId);

export default router;