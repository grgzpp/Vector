import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import UserController from '../controllers/UserController';
import { UserLevel } from '../models/User';

const checkLevelMiddleware = (allowedLevels: UserLevel[]) => {
    return async (request: Request, response: Response, next: NextFunction) => {
        console.log("Checking user level");
        const userController: UserController = UserController.getInstance();
        const user = await userController.findById((request as any).requestingUserId);
        if(user) {
            if(allowedLevels.includes(user.level)) {
                (request as any).userLevel = user.level;
                next();
            } else {
                return response.status(StatusCodes.UNAUTHORIZED).json({message: 'Unauthorized'});
            }
        } else {
            return response.status(StatusCodes.NOT_FOUND).json({message: 'User not found'});
        }
    }
}

const checkAuthMiddleware = async (request: Request, response: Response, next: NextFunction) => {
    const secretKey: string | undefined = "test_key"; //process.env.SECRET_KEY;
    if(secretKey === undefined) {
        return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: 'Internal server error'});
    }
    console.log("Checking user auth");
    const authHeader: string | undefined = request.headers.authorization;
    if(authHeader === undefined) {
        return response.status(StatusCodes.UNAUTHORIZED).send({ message: 'Auth header not provided' });
    }
    const token = authHeader.split(" ")[1];
    if(token) {
        try {
            const decodedToken: any = jwt.verify(token, secretKey);
            (request as any).requestingUserId = decodedToken.uid;
            next();
        } catch (error) {
            return response.status(StatusCodes.UNAUTHORIZED).send({ message: 'Token not valid' });
        }
    } else {
        return response.status(StatusCodes.UNAUTHORIZED).send({ message: 'Token not provided' });
    }
}

export { checkLevelMiddleware, checkAuthMiddleware }