import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import speakeasy from 'speakeasy';
import TransactionController from '../controllers/TransactionController';
import { UserLevel } from '../models/User';

/** 
 * Check if the requesting user is the creator of the transaction whose id is contained in the request.
 * This check is applied only to User (possibility to easily add levels in switch case statement), 
 * as privileged accounts do not own transactions and perform actions on other users transactions.
*/
const checkOwnershipMiddleware = (paranoid: boolean = true) => {
    return async (request: Request, response: Response, next: NextFunction) => {
        const transactionController: TransactionController = TransactionController.getInstance();
        // Find the transaction by id
        const transaction = await transactionController.findById(request.params.transactionId, false, paranoid);
        if(transaction) {
            //Switch case for future implementations of more user levels
            // Parameter userLevel from checkLevelMiddleware, required to be used first to get the user level
            switch((request as any).userLevel) {
                // Check ownership of the transaction if User
                case UserLevel.User:
                    if(transaction.creatorUserId !== (request as any).requestingUserId) {
                        // The requesting user is not the creator of the transaction
                        return response.status(StatusCodes.UNAUTHORIZED).json({ message: 'You do not have permission to execute this action on a transaction that you have not created' });
                    }
                    break;
                default:
                    break;
            }
            next();
        } else {
            return response.status(StatusCodes.NOT_FOUND).json({ message: 'Transaction not found' });
        }
    }
}

/**
 * Verify the OTP specified in the request. 
 * The two factor authentication with OTP is required for every action on transactions.
*/
const checkOtpMiddleware = async (request: Request, response: Response, next: NextFunction) => {
    if(request.body && request.body.otp) {
        const otpSecret = (request as any).otpSecret;
        if(otpSecret) {
            // Verify OTP
            if(speakeasy.totp.verify({ secret: otpSecret, encoding: 'base32', token: request.body.otp })) {
                // Successfully verified OTP
                next();
            } else {
                // OTP verification failed
                return response.status(StatusCodes.UNAUTHORIZED).json({ message: 'OTP verification failed' });
            }
        } else {
            return response.status(StatusCodes.UNAUTHORIZED).json({ message: 'OTP not set for this user. Please contact the administration to set it' });
        }
    } else {
        return response.status(StatusCodes.BAD_REQUEST).send({ message: 'OTP not provided' });
    }
}

export { checkOwnershipMiddleware, checkOtpMiddleware }