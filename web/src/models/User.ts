import sequelize from "../utils/database";
import { DataTypes, Model } from "sequelize";
import bcrypt from 'bcrypt';
import Transaction from './Transaction';
import Event from './Event';

// Enum for user levels of privileges
export enum UserLevel {
    User = 1,
    Autority = 2,
    Admin = 4
}

// User model
class User extends Model {
    public id!: string;
    public username!: string;
    public email!: string;
    public password!: string;
    public balance!: number;
    public level!: UserLevel;
    public otpSecret!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
  
User.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { // Username validation
            is: /^(?![.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![.])$/i,
            notEmpty: true,
            len: [6, 16]
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { // Email validation
            isEmail: true,
            notEmpty: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value: string) { // Password validation and hashing during set function
            // Regex pattern for password validation: 8-20 length, atleast one uppercase letter, one lowercase letter, one digit and one special character
            if(!value.match(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*+-]).{8,20}$/)) {
                throw { message: 'Provided password does not meet validation criteria' };
            }
            this.setDataValue("password", bcrypt.hashSync(value, 10));
        }
    },
    balance: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        defaultValue: 0,
        validate: { // Balance validation
            isDecimal: true,
            min: 0
        }
    },
    level: {
        type: DataTypes.INTEGER,
        defaultValue: UserLevel.User,
        allowNull: false
    },
    otpSecret: {
        type: DataTypes.STRING
    }
}, {
    sequelize,
    modelName: 'User',
    timestamps: true,
    paranoid: true
});

// User one to many association with Transaction
User.hasMany(Transaction, {
    as: 'creatorUser',
    foreignKey: 'creatorUserId'
});
Transaction.belongsTo(User, {
    as: 'creatorUser',
    foreignKey: 'creatorUserId'
});

// User one to many association with Event
User.hasMany(Event, {
    as: 'user',
    foreignKey: 'userId'
});
Event.belongsTo(User, {
    as: 'user',
    foreignKey: 'userId'
});

export default User;