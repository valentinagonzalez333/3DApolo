import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let connection;

export const getConnection = async () => {
  if (!connection) {
    connection = await mysql.createConnection({
      host:     process.env.MYSQLHOST,
      user:     process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port:     Number(process.env.MYSQLPORT)
    });
  }
  return connection;
};