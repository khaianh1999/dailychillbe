require("dotenv").config();
const mysql = require("mysql2/promise");

const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DB || "mydb",
  port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

mysqlPool.getConnection()
  .then(connection => {
    console.log("✅ MySQL connected");
    connection.release();
  })
  .catch(err => {
    console.error("❌ MySQL Connection Failed:", err);
  });

module.exports = mysqlPool;
