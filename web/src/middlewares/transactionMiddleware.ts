import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
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
            // Parameter userLevel from checkLevel middleware, required to be used first to get the user level
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

export { checkOwnershipMiddleware }