const mysql = require('mysql2/promise');
require('dotenv').config();

const dbHost = process.env.MYSQLHOST || process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306', 10);
const dbUser = process.env.MYSQLUSER || process.env.DB_USER || 'root';
const dbPassword = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || 'admin123';
const dbName = process.env.MYSQLDATABASE || process.env.DB_NAME || 'gestion_boutique';

const sslOption = (process.env.MYSQLSSL === 'true' || process.env.DB_SSL === 'true' || dbHost.includes('aivencloud.com'))
  ? { rejectUnauthorized: false }
  : undefined;

const config = {
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  connectTimeout: 30000,
  ...(sslOption && { ssl: sslOption })
};

const pool = (process.env.MYSQL_URL || process.env.DATABASE_URL)
  ? mysql.createPool({
      uri: process.env.MYSQL_URL || process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      connectTimeout: 30000,
      ...(sslOption && { ssl: sslOption })
    })
  : mysql.createPool(config);

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connexion à la base de données réussie !');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion :', error.message);
    return false;
  }
}

module.exports = { pool, testConnection };