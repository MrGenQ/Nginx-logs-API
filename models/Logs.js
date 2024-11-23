const { DataTypes } = require('sequelize');
const db = require('../database/db'); // Import the Sequelize instance

// Define Log model
const Log = db.define('log', {
    ip: { type: DataTypes.STRING, allowNull: false },
    route: { type: DataTypes.STRING, allowNull: false },
    timestamp: { type: DataTypes.DATE, allowNull: false },
  });

module.exports = Log;
