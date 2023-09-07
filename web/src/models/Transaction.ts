import sequelize from "../utils/database";
import { DataTypes, Model } from "sequelize";
import User from "./User";
import Event from './Event';

class Transaction extends Model {
    public id!: string;
    public amount!: number;
    public reason!: string;
    public creatorUserId!: string;
    public creatorUser!: User;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
  
Transaction.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            isInt: true,
            min: 1,
            max: 99999999999
        }
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            is: /^[a-zA-Z0-9\s]*$/i,
            notEmpty: true,
            len: [1, 100]
        }
    }
}, {
    sequelize,
    modelName: 'Transaction',
    timestamps: true,
    updatedAt: false,
    paranoid: true
});

Transaction.hasMany(Event, {
    as: 'transaction',
    foreignKey: 'transactionId'
});
Event.belongsTo(Transaction, {
    as: 'transaction',
    foreignKey: 'transactionId'
});

export default Transaction;