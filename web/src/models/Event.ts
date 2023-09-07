import sequelize from "../utils/database";
import { DataTypes, Model } from "sequelize";
import Transaction from "./Transaction";
import User from "./User";

export enum EventCode {
    Paid = 1,
    Taxed = 2,
    Returned = 3,
    Deleted = 4
}

class Event extends Model {
    public id!: number;
    public code!: EventCode;
    public transactionId!: string;
    public transaction!: Transaction;
    public userId!: string;
    public user!: User;
    public readonly createdAt!: Date;
}
  
Event.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    code: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'Event',
    timestamps: true,
    updatedAt: false
});

export default Event;