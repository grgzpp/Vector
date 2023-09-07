import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
    process.env.PG_DB || "pgdb",
    process.env.PG_USER || "pguser",
    process.env.PG_PASSWORD || "pgpassword",
    {
        host: process.env.PG_HOST || "localhost",
        dialect: "postgres",
    }
)

const testDbConnection = async () => {
    try {
      await sequelize.authenticate();
      console.log("Connection has been established successfully.");
    } catch (error) {
      console.error("Unable to connect to the database:", error);
    }
  };

export default sequelize;
export { testDbConnection };