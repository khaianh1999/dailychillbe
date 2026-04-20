// controllers/transactionController.js
const Transaction = require("../models/transactionModel");

const transactionController = {
  async getAll(req, res) {
    try {
      const data = await Transaction.getAllTransactions();
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách giao dịch", error: err });
    }
  },

  async getById(req, res) {
    try {
      const transaction = await Transaction.getTransactionById(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: "Không tìm thấy giao dịch" });
      }
      res.json(transaction);
    } catch (err) {
      res.status(500).json({ message: "Lỗi khi lấy giao dịch", error: err });
    }
  },

  async create(req, res) {
    try {
      await Transaction.createTransaction(req.body);
      res.status(201).json({ message: "Đã tạo giao dịch thành công" });
    } catch (err) {
      res.status(500).json({ message: "Lỗi khi tạo giao dịch", error: err });
    }
  },

  async update(req, res) {
    try {
      await Transaction.updateTransaction(req.params.id, req.body);
      res.json({ message: "Đã cập nhật giao dịch thành công" });
    } catch (err) {
      res.status(500).json({ message: "Lỗi khi cập nhật giao dịch", error: err });
    }
  },

  async remove(req, res) {
    try {
      await Transaction.deleteTransaction(req.params.id);
      res.json({ message: "Đã xoá giao dịch thành công" });
    } catch (err) {
      res.status(500).json({ message: "Lỗi khi xoá giao dịch", error: err });
    }
  },
};

module.exports = transactionController;
