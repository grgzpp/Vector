import express from 'express';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import sequelize, { testDbConnection } from "./utils/database";
import rootRoutes from './routes/rootRoutes';
import userRoutes from './routes/userRoutes';
import transactionRoutes from './routes/transactionRoutes';
import eventRoutes from './routes/eventRoutes';

const app = express();
const port = process.env.PORT || 3000; // Port from environment variable

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Test database connection
testDbConnection();

// Morgan logger setup
// Normal logging
app.use(morgan('combined', { 
    stream: fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' }) 
}));

// Internal server errors logging
app.use(morgan('combined', {
    stream: fs.createWriteStream(path.join(__dirname, 'errors.log'), { flags: 'a' }),
    skip: (req, res) => { return res.statusCode < 500 }
}));

// Routes setup
app.use('/', rootRoutes);
app.use('/users', userRoutes);
app.use('/transactions', transactionRoutes);
app.use('/events', eventRoutes);

// Server start
(async () => {
    try {
        // Sequelize models sync
        await sequelize.sync({ alter: true }); // Remove alter in production

        // Server start listening on specified port
        app.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        })
    } catch (error) {
        console.log(error);
    }
})()
