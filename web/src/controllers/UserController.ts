import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { ValidationError } from 'sequelize';
import { UserLevel } from '../models/User';
import { isPositiveInteger } from '../utils/checkUtils';

export enum BalanceAction {
    Set = "SET",
    Deposit = "DEPOSIT",
    Withdraw = "WITHDRAW"
}

class UserController {

    private static instance: UserController;
  
    private constructor() {}

    public static getInstance(): UserController {
        if(!this.instance) this.instance = new UserController();
        return this.instance;
    }

    public findById = async (id: string) => {
        try {
            return await User.findByPk(id);
        } catch (error) {
            return null;
        }
    }

    public findBalance = async (id: string) => {
        const user: User | null = await this.findById(id);
        return user ? user.balance : -1;
    }

    public getById = (otherUser: boolean) => {
        return async (request: Request, response: Response, next: NextFunction) => {
            const userId: string = otherUser ? request.params.userId : (request as any).requestingUserId;

            try {
                const user = await this.findById(userId);
                if(user) {
                    return response.status(StatusCodes.OK).json(this.responseJson(user));
                } else {
                    return response.status(StatusCodes.NOT_FOUND).json({message: 'User not found'});
                }
            } catch(error) {
                return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
            }
        }
    }

    // Get all users. This function is currently unused
    public getAll = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const allUsers = await User.findAll();
            return response.status(StatusCodes.OK).json(allUsers.map(user => this.responseJson(user)));
        } catch(error) {
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
        }
    }

    public create = (level: UserLevel) => {
        return async (request: Request, response: Response, next: NextFunction) => {
            const body = request.body;

            try {
                const user = await User.create({
                    username: body.username,
                    email: body.email,
                    password: body.password,
                    level: level
                });
                return response.status(StatusCodes.CREATED).json(this.responseJson(user));
            } catch(error) {
                if(error instanceof ValidationError) {
                    return response.status(StatusCodes.NOT_ACCEPTABLE).json({ 'message': error.errors[0].message });
                } else {
                    return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
                }
            }
        }
    }

    public updateBalance = (action: BalanceAction) => {
        return async (request: Request, response: Response, next: NextFunction) => {
            const userId: string = request.params.userId;

            try {
                let user = await this.findById(userId);
                if(user) {
                    if(user.level === UserLevel.User) {
                        if(isPositiveInteger(request.body.amount)) {
                            const amount: number = request.body.amount;

                            switch(action) {
                                case BalanceAction.Set:
                                    user = await user.update({ balance: amount });
                                    break;
                                case BalanceAction.Deposit:
                                    user = await user.increment('balance', { by: amount });
                                    break;
                                case BalanceAction.Withdraw:
                                    user = await user.decrement('balance', { by: amount });
                                    break;
                                default:
                                    return response.status(StatusCodes.BAD_REQUEST).json({message: 'Invalid action'});
                            }
                            return response.status(StatusCodes.OK).json({
                                'username': user.username,
                                'balance': user.balance
                            });
                        } else {
                            return response.status(StatusCodes.BAD_REQUEST).json({message: 'The specified amount is invalid'});
                        }
                    } else {
                        return response.status(StatusCodes.BAD_REQUEST).json({message: 'You can only affect balance of users'})
                    }
                } else {
                    return response.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
                }
            } catch(error) {
                return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
            }
        }
    }
    
    public updateById = (otherUser: boolean) => {
        return async (request: Request, response: Response, next: NextFunction) => {
            const userId: string = otherUser ? request.params.userId : (request as any).requestingUserId;
            const body = request.body;

            try {
                const user = await this.findById(userId);
                if(user) {
                    await user.update({
                        username: body.username,
                        email: body.email,
                        password: body.password
                    });
                    return response.status(StatusCodes.OK).json(this.responseJson(user));
                } else {
                    return response.status(StatusCodes.NOT_FOUND).json({message: 'User not found'});
                }
            } catch(error) {
                if(error instanceof ValidationError) {
                    return response.status(StatusCodes.NOT_ACCEPTABLE).json({ 'message': error.errors[0].message });
                } else {
                    return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
                }
            }
        }
    }
    
    public deleteById = (otherUser: boolean) => {
        return async (request: Request, response: Response, next: NextFunction) => {
            const userId: string = otherUser ? request.params.userId : (request as any).requestingUserId;

            try {
                const user = await this.findById(userId);
                if(user) {
                    await user.destroy();
                    return response.status(StatusCodes.OK).json(this.responseJson(user));
                } else {
                    return response.status(StatusCodes.NOT_FOUND).json({ message: 'User not found'});
                }
            } catch(error) {
                return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
            }
        }
    }

    public login = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const body = request.body;
            const user = await User.findOne({ where: { username: body.username } });
        
            if(user) {
                if(bcrypt.compareSync(body.password, user.getDataValue('password'))) {
                    const token = jwt.sign({uid: user.id}, process.env.SECRET_KEY || "test_key", { expiresIn: "1d" });
                    return response.status(StatusCodes.OK).json({ token });
                } else {
                    return response.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' });
                }
            } else {
                    return response.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
            }
        } catch(error) {
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
        }
    }
    
    public getBalance = (otherUser: boolean) => {
        return async (request: Request, response: Response, next: NextFunction) => {
            const userId: string = otherUser ? request.params.userId : (request as any).requestingUserId;

            try {
                const balance: number = await this.findBalance(userId);
                if(balance > 0) {
                    return response.status(StatusCodes.OK).json({ 'balance': balance });
                } else {
                    return response.status(StatusCodes.NOT_FOUND).json({message: 'User not found'});
                }
            } catch(error) {
                return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
            }
        }
    }

    private responseJson = (user: User) => {
        return {
            username: user.username,
            email: user.email,
            level: UserLevel[user.level]
        }
    } 
}

export default UserController;