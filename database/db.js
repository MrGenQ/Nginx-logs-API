const { Sequelize } = require('sequelize');

// Use environment variables
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

// MySQL database connection via Sequelize
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: 'mysql',
});

// Check if the database exists, if not, create it
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

// Synchronize models (create tables) and create the database if it doesn't exist
sequelize
  .sync({ force: false })  // This creates tables, but does not drop them each time
  .then(() => {
    console.log('Database tables synced successfully');
  })
  .catch((err) => {
    console.error('Error syncing database tables:', err);
  });

module.exports = sequelize;
