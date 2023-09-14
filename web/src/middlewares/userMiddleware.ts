import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import UserController from '../controllers/UserController';
import { UserLevel } from '../models/User';

/** Check if the requesting user is allowed to make the request based on his level. */
const checkLevelMiddleware = (allowedLevels: UserLevel[]) => {
    return async (request: Request, response: Response, next: NextFunction) => {
        const userController: UserController = UserController.getInstance();
        // Get the user by id
        const user = await userController.findById((request as any).requestingUserId);
        if(user) {
            // Check if the user level is contained in the allowed levels list
            if(allowedLevels.includes(user.level)) {
                // Add userLevel to the request to be eventually used in checkOwnershipMiddleware
                (request as any).userLevel = user.level;
                next();
            } else {
                // User unauthorized to make this request
                return response.status(StatusCodes.UNAUTHORIZED).json({ message: 'User not authorized' });
            }
        } else {
            return response.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
        }
    }
}

/** Check if the requesting user is authenticated by checking the provided bearer token. */
const checkAuthMiddleware = async (request: Request, response: Response, next: NextFunction) => {
    // Get the secret key from environment variables
    const secretKey: string = process.env.SECRET_KEY || "test_key";
    // Get auth header
    const authHeader: string | undefined = request.headers.authorization;
    if(authHeader === undefined) {
        return response.status(StatusCodes.UNAUTHORIZED).send({ message: 'Auth header not provided' });
    }
    // Get the token by splitting the auth header and taking the second word (the first is 'Bearer')
    const token = authHeader.split(" ")[1];
    if(token) {
        try {
            // Verity the token using the secret key
            const decodedToken: any = jwt.verify(token, secretKey);
            // Add requestingUserId to the request to use it in controllers
            (request as any).requestingUserId = decodedToken.uid;
            next();
        } catch(error) {
            // Token verification failed
            return response.status(StatusCodes.UNAUTHORIZED).send({ message: 'Token not valid' });
        }
    } else {
        return response.status(StatusCodes.UNAUTHORIZED).send({ message: 'Token not provided' });
    }
}

export { checkLevelMiddleware, checkAuthMiddleware }