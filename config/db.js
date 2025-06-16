require("dotenv").config(); // Load biến môi trường từ .env
const sql = require("mssql");

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, // Không cần dấu ","
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10), // Cổng phải để riêng
  options: {
    encrypt: process.env.DB_ENCRYPT === "yes", // SSL
    enableArithAbort: true,
    trustServerCertificate: true, // Cho phép chứng chỉ tự ký
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("✅ SQL Server connected");
    return pool;
  })
  .catch(err => {
    console.error("❌ SQL Server Connection Failed:", err);
    process.exit(1);
  });

module.exports = { sql, poolPromise };
