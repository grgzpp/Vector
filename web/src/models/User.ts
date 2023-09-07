import sequelize from "../utils/database";
import { DataTypes, Model } from "sequelize";
import bcrypt from 'bcrypt';
import Transaction from './Transaction';
import Event from './Event';

export enum UserLevel {
    User = 1,
    Autority = 5,
    Admin = 10
}

class User extends Model {
    public id!: string;
    public username!: string;
    public email!: string;
    public password!: string;
    public balance!: number;
    public level!: number;
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
        validate: {
            is: /^(?![.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![.])$/i,
            notEmpty: true,
            len: [6, 16]
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            notEmpty: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value: string) {
            if(!value.match(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*+-]).{8,20}$/)) {
                throw { message: 'Provided password doesn\'t meet validation criteria' };
            }
            this.setDataValue("password", bcrypt.hashSync(value, 10));
        }
    },
    balance: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            isInt: true,
            min: 0
        }
    },
    level: {
        type: DataTypes.INTEGER,
        defaultValue: UserLevel.User,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'User',
    timestamps: true,
    paranoid: true
});

User.hasMany(Transaction, {
    as: 'creatorUser',
    foreignKey: 'creatorUserId'
});
Transaction.belongsTo(User, {
    as: 'creatorUser',
    foreignKey: 'creatorUserId'
});

User.hasMany(Event, {
    as: 'user',
    foreignKey: 'userId'
});
Event.belongsTo(User, {
    as: 'user',
    foreignKey: 'userId'
});

export default User;