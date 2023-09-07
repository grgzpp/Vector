import { Request, Response, NextFunction } from 'express';
import Event, { EventCode } from '../models/Event';
import User from '../models/User';
import { StatusCodes } from 'http-status-codes';
import { ValidationError } from 'sequelize';
import UserController from './UserController';
import TransactionController from './TransactionController';

class EventController {

    private static instance: EventController;
  
    private constructor() {}

    public static getInstance(): EventController {
        if(!this.instance) this.instance = new EventController();
        return this.instance;
    }

    private findById = async (id: number, includeUser: boolean = false) => {
        try {
            return await Event.findByPk(id, { include: includeUser ? 'user' : '' });
        } catch (error) {
            return null;
        }
    }

    private findEventsByTransactionId = async (id: string, includeUser: boolean = false) => {
        try {
            return await Event.findAll({
                where: { transactionId: id },
                include: includeUser ? 'user' : ''
            });
        } catch (error) {
            return null;
        }
    }

    private isTransactionPaid = async (id: string) => {
        const eventsByTransactionId = await this.findEventsByTransactionId(id);
        if(eventsByTransactionId) {
            for(const event of eventsByTransactionId) {
                if(event.code === EventCode.Paid) {
                    return true;
                }
            }
        }
        return false;
    }

    public getEventsByTransactionId = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const eventsByTransactionId = await this.findEventsByTransactionId(request.params.transactionId, true);
            if(eventsByTransactionId) {
                return response.status(StatusCodes.OK).json(eventsByTransactionId.map(event => this.responseJson(event)));
            } else {
                return response.status(StatusCodes.NOT_FOUND).json({message: 'Transaction not found' });
            } 
        } catch (error) {
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
        }
    }

    private create = async (request: Request, response: Response, code: EventCode) => {
        try {
            let event: Event | null = await Event.create({
                code: code,
                transactionId: request.params.transactionId,
                userId: (request as any).requestingUserId
            });
            event = await this.findById(event.id, true);
            return response.status(StatusCodes.CREATED).json(this.responseJson(event!));
        } catch (error) {
            if(error instanceof ValidationError) {
                return response.status(StatusCodes.NOT_ACCEPTABLE).json({ 'message': error.errors[0].message });
            } else {
                return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
            }
        }
    }

    public payByTransactionId = async (request: Request, response: Response, next: NextFunction) => {
        const transactionId: string = request.params.transactionId;
        const userController: UserController = UserController.getInstance();
        const transactionController: TransactionController = TransactionController.getInstance();

        try {
            const transaction = await transactionController.findById(transactionId, true);
            if(transaction) {
                if(await this.isTransactionPaid(transaction.id)) {
                    return response.status(StatusCodes.FORBIDDEN).json({ message: 'Transaction already paid' });
                }
                const transactionAmount: number = transaction.amount;
                const payingUser: User | null = await userController.findById((request as any).requestingUserId);
                if(payingUser) {
                    const creatorUser: User = transaction.creatorUser;

                    if(payingUser.id === creatorUser.id) {
                        return response.status(StatusCodes.FORBIDDEN).json({ message: 'You cannot pay a transaction you have created'});
                    }
                    if(payingUser.balance < transactionAmount) {
                        return response.status(StatusCodes.FORBIDDEN).json({ message: 'You do not have enough money in your account to pay'});
                    }
                    await Promise.all([
                        payingUser.decrement('balance', { by: transactionAmount }),
                        creatorUser.increment('balance', { by: transactionAmount })
                    ]);
                    return this.create(request, response, EventCode.Paid);
                } else {
                    return response.status(StatusCodes.NOT_FOUND).json({ message: 'Paying user not found'});
                }
            } else {
                return response.status(StatusCodes.NOT_FOUND).json({ message: 'Transaction not found'});
            }
        } catch (error) {
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
        }
    }

    public taxByTransactionId = async (request: Request, response: Response, next: NextFunction) => {
        const transactionId: string = request.params.transactionId;
        const transactionController: TransactionController = TransactionController.getInstance();

        try {
            const transaction = await transactionController.findById(transactionId, true);
            if(transaction) {
                const eventsByTransactionId = await this.findEventsByTransactionId(transactionId);
                if(eventsByTransactionId) {
                    let paid: boolean = false;
                    for(const event of eventsByTransactionId) {
                        if(event.code === EventCode.Taxed) {
                            return response.status(StatusCodes.FORBIDDEN).json({ message: 'Transaction already taxed' });
                        } else if(event.code === EventCode.Paid) {
                            paid = true;
                        }
                    }
                    if(!paid) {
                        return response.status(StatusCodes.FORBIDDEN).json({ message: 'This transaction has not been paid yet, so it cannot be taxed' });
                    }
                    return this.create(request, response, EventCode.Taxed);
                } else {
                    return response.status(StatusCodes.NOT_FOUND).json({message: 'Transaction not found' });
                }
            } else {
                return response.status(StatusCodes.NOT_FOUND).json({ message: 'Transaction not found' });
            }
        } catch (error) {
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
        }
    }

    public returnByTransactionId = async (request: Request, response: Response, next: NextFunction) => {
        const transactionId: string = request.params.transactionId;
        const userController: UserController = UserController.getInstance();
        const transactionController: TransactionController = TransactionController.getInstance();

        try {
            const transaction = await transactionController.findById(transactionId, true);
            if(transaction) {
                const eventsByTransactionId = await this.findEventsByTransactionId(transactionId);
                let paid: boolean = false;
                let payingUserId: string;
                for(const event of eventsByTransactionId!) {
                    if(event.code === EventCode.Returned) {
                        return response.status(StatusCodes.FORBIDDEN).json({ message: 'Transaction already returned' });
                    } else if(event.code === EventCode.Paid) {
                        payingUserId = event.userId;
                        paid = true;
                    }
                }
                if(!paid) {
                    return response.status(StatusCodes.FORBIDDEN).json({ message: 'This transaction has not been paid yet, so it cannot be returned' });
                }
                const transactionAmount: number = transaction.amount;
                const payingUser: User | null = await userController.findById(payingUserId!);
                if(payingUser) {
                    const creatorUser: User = transaction.creatorUser;

                    if(creatorUser.balance < transactionAmount) {
                        return response.status(StatusCodes.FORBIDDEN).json({ message: 'You do not have enough money in your account to pay '});
                    }
                    await Promise.all([
                        payingUser.increment('balance', { by: transactionAmount }),
                        creatorUser.decrement('balance', { by: transactionAmount })
                    ]);
                    return this.create(request, response, EventCode.Returned);
                } else {
                    return response.status(StatusCodes.NOT_FOUND).json({ message: 'Paying user not found' });
                }
            } else {
                return response.status(StatusCodes.NOT_FOUND).json({ message: 'Transaction not found' });
            }
        } catch (error) {
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
        }
    }

    public deleteByTransactionId = async (request: Request, response: Response, next: NextFunction) => {
        const transactionId: string = request.params.transactionId;
        const transactionController: TransactionController = TransactionController.getInstance();

        try {
            const transaction = await transactionController.findById(transactionId);
            if(transaction) {
                if(await this.isTransactionPaid(transaction.id)) {
                    return response.status(StatusCodes.FORBIDDEN).json({ message: 'This transaction has already been paid, so it cannot be deleted' });
                }
                await transaction.destroy();
                return this.create(request, response, EventCode.Deleted);
            } else {
                return response.status(StatusCodes.NOT_FOUND).json({ message: 'Transaction not found' });
            }
        } catch (error) {
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
        }
    }

    private responseJson = (event: Event) => {
        return {
            id: event.id,
            code: EventCode[event.code],
            transactionId: event.transactionId,
            user: event.user.username,
            date: event.createdAt
        }
    }
}

export default EventController;