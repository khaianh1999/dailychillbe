// models/transactionModel.js
const { sql, poolPromise } = require("../config/db");

class Transaction {
  // Lấy tất cả giao dịch
  static async getAllTransactions() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT TransactionId, UserId, AssetId, Amount, Note, CreatedAt, UpdatedAt
        FROM transactions
      `);
      return result.recordset;
    } catch (err) {
      throw err;
    }
  }

  // Lấy giao dịch theo ID
  static async getTransactionById(id) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input("id", sql.Int, id)
        .query(`
          SELECT TransactionId, UserId, AssetId, Amount, Note, CreatedAt, UpdatedAt
          FROM transactions
          WHERE TransactionId = @id
        `);
      return result.recordset[0] || null;
    } catch (err) {
      throw err;
    }
  }

  // Tạo mới giao dịch
  static async createTransaction({ UserId, AssetId, Amount, Note }) {
    try {
      const pool = await poolPromise;
      await pool.request()
        .input("UserId", sql.Int, UserId)
        .input("AssetId", sql.Int, AssetId)
        .input("Amount", sql.Decimal(18, 2), Amount)
        .input("Note", sql.NVarChar, Note || null)
        .input("CreatedAt", sql.DateTime, new Date())
        .input("UpdatedAt", sql.DateTime, new Date())
        .query(`
          INSERT INTO transactions (UserId, AssetId, Amount, Note, CreatedAt, UpdatedAt)
          VALUES (@UserId, @AssetId, @Amount, @Note, @CreatedAt, @UpdatedAt)
        `);
    } catch (err) {
      throw err;
    }
  }

  // Cập nhật giao dịch
  static async updateTransaction(id, { AssetId, Amount, Note }) {
    try {
      const pool = await poolPromise;
      await pool.request()
        .input("id", sql.Int, id)
        .input("AssetId", sql.Int, AssetId)
        .input("Amount", sql.Decimal(18, 2), Amount)
        .input("Note", sql.NVarChar, Note || null)
        .input("UpdatedAt", sql.DateTime, new Date())
        .query(`
          UPDATE transactions
          SET AssetId=@AssetId, Amount=@Amount, Note=@Note, UpdatedAt=@UpdatedAt
          WHERE TransactionId=@id
        `);
    } catch (err) {
      throw err;
    }
  }

  // Xóa giao dịch
  static async deleteTransaction(id) {
    try {
      const pool = await poolPromise;
      await pool.request()
        .input("id", sql.Int, id)
        .query("DELETE FROM transactions WHERE TransactionId=@id");
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Transaction;
