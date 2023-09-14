import sequelize from "../utils/database";
import { DataTypes, Model } from "sequelize";
import User from "./User";
import Event from './Event';

// Transaction model
class Transaction extends Model {
    public id!: string;
    public amount!: number;
    public reason!: string;
    public creatorUserId!: string;
    public creatorUser!: User;
    public readonly createdAt!: Date;
    public readonly deletedAt!: Date;
}
  
Transaction.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        defaultValue: 1,
        validate: { // Amount validation, should always be true as the main validation is done by the controller on transaction creation
            isDecimal: true,
            min: 10**-(process.env.DECIMAL_DIGITS || 2),
            max: 1000000000
        }
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { // Reason validation
            is: /^[a-zA-Z0-9\s]*$/i,
            notEmpty: true,
            len: [1, 150]
        }
    }
}, {
    sequelize,
    modelName: 'Transaction',
    timestamps: true,
    updatedAt: false, // Transactions in database should only be created and never updated (Events are created instead), so updatedAt is not required
    paranoid: true
});

// Transaction one to many association with Event
Transaction.hasMany(Event, {
    as: 'transaction',
    foreignKey: 'transactionId'
});
Event.belongsTo(Transaction, {
    as: 'transaction',
    foreignKey: 'transactionId'
});

export default Transaction;