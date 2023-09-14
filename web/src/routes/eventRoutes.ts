import express from 'express';
import EventController from '../controllers/EventController';
import { checkAuthMiddleware, checkLevelMiddleware } from '../middlewares/userMiddleware';
import { checkOwnershipMiddleware, checkOtpMiddleware } from '../middlewares/transactionMiddleware';
import { UserLevel } from '../models/User';

const router = express.Router();
const eventController: EventController = EventController.getInstance();

router
    .get('/:transactionId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.User, UserLevel.Autority, UserLevel.Admin]), checkOwnershipMiddleware(false), eventController.getEventsByTransactionId) // Get all events related to a transaction
    .post('/pay/:transactionId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.User]), checkOtpMiddleware, eventController.payTransactionById) // Pay a transaction (requires OTP authentication)
    .post('/tax/:transactionId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Autority, UserLevel.Admin]), eventController.taxTransactionById) // Tax a paid transaction
    .post('/return/:transactionId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.User, UserLevel.Admin]), checkOwnershipMiddleware(), checkOtpMiddleware, eventController.returnTransactionById) // Return a paid transaction (requires OTP authentication)
    .post('/delete/:transactionId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.User, UserLevel.Admin]), checkOwnershipMiddleware(), eventController.deleteTransactionById); // Delete a not-paid transaction

export default router;