// models/expenseModel.js
const { sql, poolPromise } = require("../config/db");

class Expense {
  // Lấy toàn bộ danh sách chi tiêu
  static async getAllExpenses() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT ExpenseId, UserId, Name, Amount, DueDate, CreatedAt, UpdatedAt
        FROM expenses
      `);
      return result.recordset;
    } catch (err) {
      throw err;
    }
  }

  // Lấy chi tiêu theo id
  static async getExpenseById(id) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input("id", sql.Int, id)
        .query(`
          SELECT ExpenseId, UserId, Name, Amount, DueDate, CreatedAt, UpdatedAt
          FROM expenses
          WHERE ExpenseId = @id
        `);
      return result.recordset[0] || null;
    } catch (err) {
      throw err;
    }
  }

  // Tạo mới chi tiêu
  static async createExpense({ UserId, Name, Amount, DueDate }) {
    try {
      const pool = await poolPromise;
      await pool.request()
        .input("UserId", sql.Int, UserId)
        .input("Name", sql.NVarChar, Name)
        .input("Amount", sql.Decimal(18, 2), Amount)
        .input("DueDate", sql.Date, DueDate)
        .input("CreatedAt", sql.DateTime, new Date())
        .input("UpdatedAt", sql.DateTime, new Date())
        .query(`
          INSERT INTO expenses (UserId, Name, Amount, DueDate, CreatedAt, UpdatedAt)
          VALUES (@UserId, @Name, @Amount, @DueDate, @CreatedAt, @UpdatedAt)
        `);
    } catch (err) {
      throw err;
    }
  }

  // Cập nhật chi tiêu
  static async updateExpense(id, { Name, Amount, DueDate }) {
    try {
      const pool = await poolPromise;
      await pool.request()
        .input("id", sql.Int, id)
        .input("Name", sql.NVarChar, Name)
        .input("Amount", sql.Decimal(18, 2), Amount)
        .input("DueDate", sql.Date, DueDate)
        .input("UpdatedAt", sql.DateTime, new Date())
        .query(`
          UPDATE expenses
          SET Name=@Name, Amount=@Amount, DueDate=@DueDate, UpdatedAt=@UpdatedAt
          WHERE ExpenseId=@id
        `);
    } catch (err) {
      throw err;
    }
  }

  // Xoá chi tiêu
  static async deleteExpense(id) {
    try {
      const pool = await poolPromise;
      await pool.request()
        .input("id", sql.Int, id)
        .query(`DELETE FROM expenses WHERE ExpenseId=@id`);
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Expense;
