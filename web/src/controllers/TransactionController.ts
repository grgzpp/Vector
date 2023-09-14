import { Request, Response, NextFunction } from 'express';
import Transaction from '../models/Transaction';
import { StatusCodes } from 'http-status-codes';
import { Op, ValidationError } from 'sequelize';
import { isAmountValid, isPositiveInteger } from '../utils/checkUtils';

class TransactionController {

    // Singleton instance for the transaction controller
    private static instance: TransactionController;
  
    private constructor() {}

    public static getInstance(): TransactionController {
        if(!this.instance) this.instance = new TransactionController();
        return this.instance;
    }

    /** Find a transaction by id. Optional parameters for creator user object and search for self deleted transactions. */
    public findById = async (id: string, includeCreatorUser: boolean = false, paranoid: boolean = true) => {
        try {
            return await Transaction.findByPk(id, { 
                include: includeCreatorUser ? 'creatorUser' : '',
                paranoid: paranoid
            });
        } catch(error) {
            return null;
        }
    }

    /** Get a transaction by id. */
    public getById = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const transaction = await this.findById(request.params.transactionId, true, false);
            if(transaction) {
                return response.status(StatusCodes.OK).json(this.responseJson(transaction));
            } else {
                return response.status(StatusCodes.NOT_FOUND).json({ message: 'Transaction not found' });
            }
        } catch(error) {
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error); 
        }
    }

    /** 
     * Get all transaction created by one user between given time interval. 
     * The 'otherUser' option is used to specify whether the action is performed by a User
     * on himself or by a privileged user (Authority, Admin) on another user.
    */
    public getBetweenInterval = (otherUser: boolean) => {
        return async (request: Request, response: Response, next: NextFunction) => {
            const userId: string = otherUser ? request.params.userId : (request as any).requestingUserId;

            try {
                // Check if both timestamps are integers and positive
                if(isPositiveInteger(request.params.from) && isPositiveInteger(request.params.to)) {
                    const from: number = Number(request.params.from);
                    const to: number = Number(request.params.to);
                    // Check if given dates are correctly ordered
                    if(from < to) {
                        // Search for creatorUserId and createdAt with time interval
                        const transactionsBetweenInterval = await Transaction.findAll({
                            where: {
                                [Op.and]: [
                                    { creatorUserId: userId },
                                    { createdAt: {
                                        [Op.between]: [new Date(Number(request.params.from)), new Date(Number(request.params.to))]
                                    }}
                                ]
                            },
                            include: 'creatorUser',
                            paranoid: false
                        });
                        return response.status(StatusCodes.OK).json(transactionsBetweenInterval.map(transaction => this.responseJson(transaction)));
                    } else {
                        return response.status(StatusCodes.BAD_REQUEST).json({ message: 'The first date specified must be before the second' });
                    }
                } else {
                    return response.status(StatusCodes.BAD_REQUEST).json({ message: 'The specified date is invalid' });
                }
            } catch(error) {
                return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
            }
        }
    }

    /** Create a transaction, specifying amount and reason. */
    public create = async (request: Request, response: Response, next: NextFunction) => {
        const body = request.body;

        try {
            const amount: number = body.amount;
            if(isAmountValid(amount)) {
                let transaction: Transaction | null = await Transaction.create({
                    amount: amount,
                    reason: body.reason,
                    creatorUserId: (request as any).requestingUserId
                });
                transaction = await this.findById(transaction.id, true);
                return response.status(StatusCodes.CREATED).json(this.responseJson(transaction!));
            } else {
                return response.status(StatusCodes.BAD_REQUEST).json({ message: 'Provided amount does not meet validation criteria: positive number with 2 decimal digits and max 9 integer digits' });
            }
        } catch(error) {
            if(error instanceof ValidationError) {
                return response.status(StatusCodes.BAD_REQUEST).json({ message: error.errors[0].message });
            } else {
                return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
            }
        }
    }

    /** Private method to format transaction details as JSON for response. */
    private responseJson = (transaction: Transaction) => {
        return {
            id: transaction.id,
            createdBy: transaction.creatorUser.username,
            amount: transaction.amount,
            reason: transaction.reason,
            createdAt: transaction.createdAt.toString()
        }
    }
}

export default TransactionController;