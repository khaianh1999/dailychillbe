// controllers/expenseController.js
const Expense = require("../models/expenseModel");

const expenseController = {
  async getAll(req, res) {
    try {
      const expenses = await Expense.getAllExpenses();
      res.json(expenses);
    } catch (err) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách chi tiêu", error: err });
    }
  },

  async getById(req, res) {
    try {
      const expense = await Expense.getExpenseById(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: "Không tìm thấy chi tiêu" });
      }
      res.json(expense);
    } catch (err) {
      res.status(500).json({ message: "Lỗi khi lấy chi tiêu", error: err });
    }
  },

  async create(req, res) {
    try {
      await Expense.createExpense(req.body);
      res.status(201).json({ message: "Đã tạo chi tiêu thành công" });
    } catch (err) {
      res.status(500).json({ message: "Lỗi khi tạo chi tiêu", error: err });
    }
  },

  async update(req, res) {
    try {
      await Expense.updateExpense(req.params.id, req.body);
      res.json({ message: "Đã cập nhật chi tiêu thành công" });
    } catch (err) {
      res.status(500).json({ message: "Lỗi khi cập nhật chi tiêu", error: err });
    }
  },

  async remove(req, res) {
    try {
      await Expense.deleteExpense(req.params.id);
      res.json({ message: "Đã xóa chi tiêu thành công" });
    } catch (err) {
      res.status(500).json({ message: "Lỗi khi xóa chi tiêu", error: err });
    }
  }
};

module.exports = expenseController;
