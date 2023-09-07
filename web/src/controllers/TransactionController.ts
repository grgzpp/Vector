import { Request, Response, NextFunction } from 'express';
import Transaction from '../models/Transaction';
import { StatusCodes } from 'http-status-codes';
import { Op, ValidationError } from 'sequelize';
import { isPositiveInteger } from '../utils/checkUtils';

class TransactionController {

    private static instance: TransactionController;
  
    private constructor() {}

    public static getInstance(): TransactionController {
        if(!this.instance) this.instance = new TransactionController();
        return this.instance;
    }

    public findById = async (id: string, includeCreatorUser: boolean = false, paranoid: boolean = true) => {
        try {
            return await Transaction.findByPk(id, { 
                include: includeCreatorUser ? 'creatorUser' : '',
                paranoid: paranoid
            });
        } catch (error) {
            return null;
        }
    }

    public getById = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const transaction = await this.findById(request.params.transactionId, true, false);
            if(transaction) {
                return response.status(StatusCodes.OK).json(this.responseJson(transaction));
            } else {
                return response.status(StatusCodes.NOT_FOUND).json({message: 'Transaction not found' });
            }
        } catch (error) {
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error); 
        }
    }

    public getBetweenInterval = (otherUser: boolean) => {
        return async (request: Request, response: Response, next: NextFunction) => {
            const userId: string = otherUser ? request.params.userId : (request as any).requestingUserId;

            if(isPositiveInteger(request.params.from) && isPositiveInteger(request.params.to)) {
                try {
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
                } catch (error) {
                    return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
                }
            } else {
                return response.status(StatusCodes.BAD_REQUEST).json({message: 'The specified date is invalid' });
            }
        }
    }

    public create = async (request: Request, response: Response, next: NextFunction) => {
        const body = request.body;

        try {
            let transaction: Transaction | null = await Transaction.create({
                amount: body.amount,
                reason: body.reason,
                creatorUserId: (request as any).requestingUserId
            });
            transaction = await this.findById(transaction.id, true);
            return response.status(StatusCodes.CREATED).json(this.responseJson(transaction!));
        } catch (error) {
            if(error instanceof ValidationError) {
                return response.status(StatusCodes.NOT_ACCEPTABLE).json({ 'message': error.errors[0].message });
            } else {
                return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
            }
        }
    }

    private responseJson = (transaction: Transaction) => {
        return {
            id: transaction.id,
            createdBy: transaction.creatorUser.username,
            amount: transaction.amount,
            reason: transaction.reason
        }
    }
}

export default TransactionController;