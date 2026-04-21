import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let connection;

export const getConnection = async () => {
  if (!connection) {
    connection = await mysql.createConnection({
      host: process.env.HOST,
      user: process.env.USER,
      password: process.env.PASSWORD,
      database: process.env.DATABASE
    });
  }

  return connection;
};