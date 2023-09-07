import express from 'express';
import UserController from '../controllers/UserController';
import { checkAuthMiddleware, checkLevelMiddleware } from '../middlewares/userMiddleware';
import { UserLevel } from '../models/User';

const router = express.Router();
const userController: UserController = UserController.getInstance();

router
    .get('/', checkAuthMiddleware, userController.getById(false))
    .get('/:userId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Autority, UserLevel.Admin]), userController.getById(true))
    .post('/', userController.create(UserLevel.User))
    .post('/autority', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Admin]), userController.create(UserLevel.Autority))
    .put('/', checkAuthMiddleware, userController.updateById(false))
    .put('/:userId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Admin]), userController.updateById(true))
    .delete('/', checkAuthMiddleware, userController.deleteById(false))
    .delete('/:userId', checkAuthMiddleware, checkLevelMiddleware([UserLevel.Admin]), userController.deleteById(true));

export default router;