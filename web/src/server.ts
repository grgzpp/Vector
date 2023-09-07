import express from 'express';
import sequelize, { testDbConnection } from "./utils/database";
import rootRoutes from './routes/rootRoutes';
import userRoutes from './routes/userRoutes';
import transactionRoutes from './routes/transactionRoutes';
import eventRoutes from './routes/eventRoutes';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

testDbConnection();

// Routes
app.use('/', rootRoutes);
app.use('/users', userRoutes);
app.use('/transactions', transactionRoutes);
app.use('/events', eventRoutes);

// Server start
(async () => {
    try {
        // Sequelize models sync
        await sequelize.sync({ alter: true })

        // Server start listening on specified port
        app.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        })
    } catch (error) {
        console.log(error)
    }
})()
