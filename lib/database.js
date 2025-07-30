const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');

class DatabaseManager {
    static instance = null;

    static getInstance() {
        if (!DatabaseManager.instance) {
            const isHuggingFace = fs.existsSync('/tmp');
            const localDbPath = isHuggingFace ? '/tmp/database.db' : './database.db';
            const DATABASE_URL = process.env.DATABASE_URL || localDbPath;

            DatabaseManager.instance =
                DATABASE_URL === localDbPath
                    ? new Sequelize({
                            dialect: 'sqlite',
                            storage: DATABASE_URL,
                            logging: false,
                      })
                    : new Sequelize(DATABASE_URL, {
                            dialect: 'postgres',
                            ssl: true,
                            protocol: 'postgres',
                            dialectOptions: {
                                native: true,
                                ssl: { require: true, rejectUnauthorized: false },
                            },
                            logging: false,
                      });
        }
        return DatabaseManager.instance;
    }
}

const DATABASE = DatabaseManager.getInstance();

DATABASE.sync()
    .then(() => {
        console.log('✅ Database synchronized successfully.');
    })
    .catch((error) => {
        console.error('❌ Error synchronizing the database:', error);
    });

module.exports = { DATABASE };
