const { DataTypes } = require('sequelize');
const db = require('../database/db'); // Import the Sequelize instance

const ApiUser = db.define('ApiUser', {
    client_credentials: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false,
    },
    client_secret: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
}, {
    timestamps: true, // This automatically adds createdAt and updatedAt columns
    tableName: 'api_users', // Specifies the table name in the database
});

module.exports = ApiUser;
