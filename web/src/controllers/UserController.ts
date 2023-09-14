import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { StatusCodes } from 'http-status-codes';
import { ValidationError } from 'sequelize';
import { UserLevel } from '../models/User';
import { isAmountValid } from '../utils/checkUtils';

// Enum for balance actions
export enum BalanceAction {
    Set = "SET",
    Deposit = "DEPOSIT",
    Withdraw = "WITHDRAW"
}

class UserController {

    // Singleton instance for the user controller
    private static instance: UserController;
  
    private constructor() {}

    public static getInstance(): UserController {
        if(!this.instance) this.instance = new UserController();
        return this.instance;
    }

    /** Find a user by UUID. */
    public findById = async (id: string) => {
        try {
            return await User.findByPk(id);
        } catch(error) {
            return null;
        }
    }

    /** Find the balance of a user by UUID. */
    public findBalance = async (id: string) => {
        const user: User | null = await this.findById(id);
        return user ? user.balance : -1;
    }

    /** Generate base32 OTP secret and show the relative QRCode. */
    private generateOtpSecret(email: string): string {
        // Generate OTP secret
        const otpSecret = speakeasy.generateSecret();
        // The next two steps are unnecessary in production, as the client application will display this qrcode from the base32 secret received in response
        // Generate a Google Authenticator-compatible otpauth:// URL for passing the secret to a mobile device to install the secret
        const otpauthURL: string = speakeasy.otpauthURL({ 
            secret: otpSecret.ascii, 
            label: email,
            issuer: 'Vector'
        });
        // Display otpauth URL as QRCode
        qrcode.toString(otpauthURL, {type: 'terminal'}, function (err, url) {
            console.log(url);
        });
        return otpSecret.base32;
    }

    /** 
     * Get a user by UUID. 
     * The 'otherUser' option is used to specify whether the action is performed by a User
     * on himself or by a privileged user (Authority, Admin) on another user.
    */
    public getById = (otherUser: boolean) => {
        return async (request: Request, response: Response, next: NextFunction) => {
            const userId: string = otherUser ? request.params.userId : (request as any).requestingUserId;

            try {
                const user = await this.findById(userId);
                if(user) {
                    return response.status(StatusCodes.OK).json(this.responseJson(user));
                } else {
                    return response.status(StatusCodes.NOT_FOUND).json({ message: 'User not found'});
                }
            } catch(error) {
                // Handle errors, for example database query errors
                return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
            }
        }
    }

    /** 
     * Get a user by username. Only available for privileged user (Authority, Admin).
     * It also returns user UUID, useful for other privileged operations requiring it.
    */
    public getByUsername = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const user = await User.findOne({ 
                where : { username: request.params.username } 
            });
            if(user) {
                const responseJson: any = this.responseJson(user);
                responseJson.id = user.id;
                return response.status(StatusCodes.OK).json(responseJson);
            } else {
                return response.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
            }
        } catch(error) {
            // Handle errors, for example database query errors
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
        }
    }
    

    /** Get all users. This function is currently unused. */
    public getAll = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const allUsers = await User.findAll();
            return response.status(StatusCodes.OK).json(allUsers.map(user => this.responseJson(user)));
        } catch(error) {
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
        }
    }

    /** 
     * Create a new user. 
     * The 'level' option is used to specify the privileges of the new user. An Autority user can only be created by an Admin.
    */
    public create = (level: UserLevel) => {
        return async (request: Request, response: Response, next: NextFunction) => {
            const body = request.body;

            try {
                const email: string = body.email;
                // Generate OTP secret
                const otpSecret: string = this.generateOtpSecret(email);
                // Create a new user with the provided data and return their details in the response
                const user = await User.create({
                    username: body.username,
                    email: email,
                    password: body.password,
                    level: level,
                    otpSecret: otpSecret
                });
                
                const responseJson: any = this.responseJson(user);
                // Append OTP secret to response
                responseJson.otpSecret = otpSecret;
                return response.status(StatusCodes.CREATED).json(responseJson);
            } catch(error) {
                if(error instanceof ValidationError) {
                    return response.status(StatusCodes.BAD_REQUEST).json({ message: error.errors[0].message });
                } else {
                    return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
                }
            }
        }
    }

    /** 
     * Update user's balance. This action can be performed only by Admin. 
     * The 'action' option is used to specify between balance actions: Set, Deposit (increase balance), Withdraw (decrease balance).
    */
    public updateBalance = (action: BalanceAction) => {
        return async (request: Request, response: Response, next: NextFunction) => {
            const userId: string = request.params.userId;

            try {
                let user = await this.findById(userId);
                if(user) {
                    if(user.level === UserLevel.User) {
                        const amount: number = request.body.amount;
                        if(isAmountValid(amount)) {
                            
                            // Switch between balance actions and performs the corresponding action 
                            switch(action) {
                                case BalanceAction.Set:
                                    // Set the user's balance to the specified amount
                                    user = await user.update({ balance: amount });
                                    break;
                                case BalanceAction.Deposit:
                                    // Increment the user's balance by the specified amount
                                    user = await user.increment('balance', { by: amount });
                                    break;
                                case BalanceAction.Withdraw:
                                    // Decrement the user's balance by the specified amount
                                    user = await user.decrement('balance', { by: amount });
                                    break;
                                default:
                                    return response.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid action' });
                            }
                            return response.status(StatusCodes.OK).json({
                                'username': user.username,
                                'balance': user.balance
                            });
                        } else {
                            return response.status(StatusCodes.BAD_REQUEST).json({ message: 'Provided amount does not meet validation criteria: positive number with 2 decimal digits and max 9 integer digits' });
                        }
                    } else {
                        // Only normal users have a balance, so any balance action can be performed only on them.
                        return response.status(StatusCodes.BAD_REQUEST).json({ message: 'You can only affect balance of users' })
                    }
                } else {
                    return response.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
                }
            } catch(error) {
                return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
            }
        }
    }
    
    /** 
     * Update a user by UUID. 
     * The 'otherUser' option is used to specify whether the action is performed by a User
     * on himself or by a privileged user (Authority, Admin) on another user.
    */
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
                    return response.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
                }
            } catch(error) {
                if(error instanceof ValidationError) {
                    return response.status(StatusCodes.BAD_REQUEST).json({ message: error.errors[0].message });
                } else {
                    return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
                }
            }
        }
    }

    /** Update a user OTP secret by UUID. Only available for Admin. */
    public updateOtpSecretById =  async (request: Request, response: Response, next: NextFunction) => {
        const userId: string = request.params.userId;

        try {
            const user = await this.findById(userId);
            if(user) {
                const otpSecret: string = this.generateOtpSecret(user.email);
                await user.update({ otpSecret: otpSecret });
                return response.status(StatusCodes.OK).json({ 'otpSecret': otpSecret });
            } else {
                return response.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
            }
        } catch(error) {
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
        }
    }
    
    /** 
     * Delete a user by UUID. 
     * The 'otherUser' option is used to specify whether the action is performed by a User
     * on himself or by a privileged user (Authority, Admin) on another user.
    */
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

    /** 
     * Login a user by username and password. 
     * If given data is correct, the respone will contain a JWT token that the user will use to authenticate.
    */
    public login = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const body = request.body;
            // Find the user by username
            const user = await User.findOne({ where: { username: body.username } });
        
            if(user) {
                // Comparison of hashed passwords
                if(bcrypt.compareSync(body.password, user.getDataValue('password'))) {
                    // Generate the JWT token for authentication using the server secret key
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
    
    /** 
     * Get user's balance. 
     * The 'otherUser' option is used to specify whether the action is performed by a User
     * on himself or by a privileged user (Authority, Admin) on another user.
    */
    public getBalance = (otherUser: boolean) => {
        return async (request: Request, response: Response, next: NextFunction) => {
            const userId: string = otherUser ? request.params.userId : (request as any).requestingUserId;

            try {
                // Find the balance of a user by UUID. Il the balance is negative, findBalance() method couldn't find the user
                const balance: number = await this.findBalance(userId);
                if(balance >= 0) {
                    return response.status(StatusCodes.OK).json({ 'balance': balance });
                } else {
                    return response.status(StatusCodes.NOT_FOUND).json({ message: 'User not found'});
                }
            } catch(error) {
                return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
            }
        }
    }

    /** Private method to format user details as JSON for response. */
    private responseJson = (user: User) => {
        return {
            username: user.username,
            email: user.email,
            level: UserLevel[user.level]
        }
    } 
}

export default UserController;