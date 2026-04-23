import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let connection;

export const getConnection = async () => {
  if (!connection) {
    connection = await mysql.createConnection({
  host: "shinkansen.proxy.rlwy.net",
  user: "root",
  password: process.env.MYSQLPASSWORD,
  database: "railway",
  port: 20902
});
  }

  return connection;
};