import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import TransactionController from '../controllers/TransactionController';
import { UserLevel } from '../models/User';

const checkOwnershipMiddleware = (paranoid: boolean = true) => {
    return async (request: Request, response: Response, next: NextFunction) => {
        console.log("Checking user level")
        const transactionController: TransactionController = TransactionController.getInstance();
        const transaction = await transactionController.findById(request.params.transactionId, false, paranoid);
        if(transaction) {
            //Switch case for future implementations of more user levels
            switch((request as any).userLevel) {
                case UserLevel.User:
                    if(transaction.creatorUserId !== (request as any).requestingUserId) {
                        return response.status(StatusCodes.UNAUTHORIZED).json({message: 'You do not have permission to execute this action on a transaction that you have not created'});
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