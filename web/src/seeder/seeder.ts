import fs from 'fs';
import path from 'path';
import User from "../models/User";
import Transaction from '../models/Transaction';

// Database tables seeding
(async () => {
    try {
        await User.bulkCreate(JSON.parse(fs.readFileSync(path.join(__dirname, '../../seeders/users_seeder.json'), 'utf-8')));
        await Transaction.bulkCreate(JSON.parse(fs.readFileSync(path.join(__dirname, '../../seeders/transactions_seeder.json'), 'utf-8')));
        console.log('Database successfully seeded');
    } catch(error) {
        console.error('Error seeding database:', error);
    }
})()