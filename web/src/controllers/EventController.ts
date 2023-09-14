import { Request, Response, NextFunction } from 'express';
import Event, { EventCode } from '../models/Event';
import User from '../models/User';
import { StatusCodes } from 'http-status-codes';
import { ValidationError } from 'sequelize';
import UserController from './UserController';
import TransactionController from './TransactionController';

class EventController {

    // Singleton instance for the event controller
    private static instance: EventController;
  
    private constructor() {}

    public static getInstance(): EventController {
        if(!this.instance) this.instance = new EventController();
        return this.instance;
    }

    /** Find an event by id. Optional parameter for creator user object. */
    private findById = async (id: number, includeUser: boolean = false) => {
        try {
            return await Event.findByPk(id, { include: includeUser ? 'user' : '' });
        } catch(error) {
            return null;
        }
    }

    /** Find all events related to a specific transaction. Optional parameter for creator user object. */
    private findEventsByTransactionId = async (id: string, includeUser: boolean = false) => {
        try {
            return await Event.findAll({
                where: { transactionId: id },
                include: includeUser ? 'user' : ''
            });
        } catch(error) {
            return null;
        }
    }

    /** Check if transaction has been paid. */
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

    /** Get all events related to a specific transaction. */    
    public getEventsByTransactionId = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const eventsByTransactionId = await this.findEventsByTransactionId(request.params.transactionId, true);
            if(eventsByTransactionId) {
                return response.status(StatusCodes.OK).json(eventsByTransactionId.map(event => this.responseJson(event)));
            } else {
                return response.status(StatusCodes.NOT_FOUND).json({ message: 'Transaction not found' });
            } 
        } catch(error) {
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
        }
    }

    /** Register (create) an event, specifying event code. */
    private create = async (request: Request, response: Response, code: EventCode) => {
        try {
            let event: Event | null = await Event.create({
                code: code,
                transactionId: request.params.transactionId,
                userId: (request as any).requestingUserId
            });
            event = await this.findById(event.id, true);
            return response.status(StatusCodes.CREATED).json(this.responseJson(event!));
        } catch(error) {
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
        }
    }

    /** Pay a transaction by id. */
    public payTransactionById = async (request: Request, response: Response, next: NextFunction) => {
        const transactionId: string = request.params.transactionId;
        const userController: UserController = UserController.getInstance();
        const transactionController: TransactionController = TransactionController.getInstance();

        try {
            // Find transaction by specified id
            const transaction = await transactionController.findById(transactionId, true);
            if(transaction) {
                // Check whether transaction is already paid
                if(await this.isTransactionPaid(transaction.id)) {
                    return response.status(StatusCodes.FORBIDDEN).json({ message: 'Transaction already paid' });
                }
                // Transaction amount
                const transactionAmount: number = transaction.amount;
                // Check if paying user exists. This should never fail because the paying user is actually making the request for payment
                const payingUser: User | null = await userController.findById((request as any).requestingUserId);
                if(payingUser) {
                    // Get the creator user of the transaction
                    const creatorUser: User = transaction.creatorUser;

                    // Check if paying and creator user are the same
                    if(payingUser.id === creatorUser.id) {
                        return response.status(StatusCodes.FORBIDDEN).json({ message: 'You cannot pay a transaction you have created' });
                    }
                    // Check if paying user has enough money to pay
                    if(payingUser.balance < transactionAmount) {
                        return response.status(StatusCodes.FORBIDDEN).json({ message: 'You do not have enough money in your account to pay' });
                    }
                    // Move the money from paying to creator user, using atomic transaction to ensure both actions are made or neither
                    await Promise.all([
                        payingUser.decrement('balance', { by: transactionAmount }),
                        creatorUser.increment('balance', { by: transactionAmount })
                    ]);
                    // Using the create method to register the event
                    return this.create(request, response, EventCode.Paid);
                } else {
                    return response.status(StatusCodes.NOT_FOUND).json({ message: 'Paying user not found' });
                }
            } else {
                return response.status(StatusCodes.NOT_FOUND).json({ message: 'Transaction not found' });
            }
        } catch(error) {
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
        }
    }

    /** Tax a transaction by id. It only register the event, no action is made on the money. */
    public taxTransactionById = async (request: Request, response: Response, next: NextFunction) => {
        const transactionId: string = request.params.transactionId;
        const transactionController: TransactionController = TransactionController.getInstance();

        try {
            // Find transaction by specified id
            const transaction = await transactionController.findById(transactionId, true);
            if(transaction) {
                const eventsByTransactionId = await this.findEventsByTransactionId(transactionId);
                if(eventsByTransactionId) {
                    let paid: boolean = false;
                    // Check if the transaction is paid (required to be taxed) and if it has been already taxed
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
                    // Using the create method to register the event
                    return this.create(request, response, EventCode.Taxed);
                } else {
                    return response.status(StatusCodes.NOT_FOUND).json({ message: 'Transaction not found' });
                }
            } else {
                return response.status(StatusCodes.NOT_FOUND).json({ message: 'Transaction not found' });
            }
        } catch(error) {
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
        }
    }

    /** Return a paid transaction by id. */
    public returnTransactionById = async (request: Request, response: Response, next: NextFunction) => {
        const transactionId: string = request.params.transactionId;
        const userController: UserController = UserController.getInstance();
        const transactionController: TransactionController = TransactionController.getInstance();

        try {
            // Find transaction by specified id
            const transaction = await transactionController.findById(transactionId, true);
            if(transaction) {
                const eventsByTransactionId = await this.findEventsByTransactionId(transactionId);
                let paid: boolean = false;
                let payingUserId: string;
                // Check if the transaction is paid (required to be returned) and if it has been already returned
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
                // Same actions of payTransactionById method but paying and creator users are reversed
                const transactionAmount: number = transaction.amount;
                const payingUser: User | null = await userController.findById(payingUserId!);
                if(payingUser) {
                    const creatorUser: User = transaction.creatorUser;

                    if(creatorUser.balance < transactionAmount) {
                        return response.status(StatusCodes.FORBIDDEN).json({ message: 'Not enough money to return the transaction' });
                    }
                    await Promise.all([
                        payingUser.increment('balance', { by: transactionAmount }),
                        creatorUser.decrement('balance', { by: transactionAmount })
                    ]);
                    // Using the create method to register the event
                    return this.create(request, response, EventCode.Returned);
                } else {
                    return response.status(StatusCodes.NOT_FOUND).json({ message: 'Paying user not found' });
                }
            } else {
                return response.status(StatusCodes.NOT_FOUND).json({ message: 'Transaction not found' });
            }
        } catch(error) {
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
        }
    }

    /** Return a not-paid transaction by id. */
    public deleteTransactionById = async (request: Request, response: Response, next: NextFunction) => {
        const transactionId: string = request.params.transactionId;
        const transactionController: TransactionController = TransactionController.getInstance();

        try {
            // Find transaction by specified id
            const transaction = await transactionController.findById(transactionId);
            if(transaction) {
                // Check if the transaction is paid
                if(await this.isTransactionPaid(transaction.id)) {
                    return response.status(StatusCodes.FORBIDDEN).json({ message: 'This transaction has already been paid, so it cannot be deleted' });
                }
                // Soft-delete the transaction
                await transaction.destroy();
                // Using the create method to register the event
                return this.create(request, response, EventCode.Deleted);
            } else {
                return response.status(StatusCodes.NOT_FOUND).json({ message: 'Transaction not found' });
            }
        } catch(error) {
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
        }
    }

    /** Private method to format event details as JSON for response. */
    private responseJson = (event: Event) => {
        return {
            id: event.id,
            code: EventCode[event.code],
            transactionId: event.transactionId,
            user: event.user.username,
            date: event.createdAt.toString()
        }
    }
}

export default EventController;