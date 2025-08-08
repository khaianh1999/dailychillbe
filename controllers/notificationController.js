// controllers/notificationController.js
const Notification = require("../models/notificationModel");

const notificationController = {
  async getAll(req, res) {
    try {
      const userId = parseInt(req.query.userId, 10);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "userId không hợp lệ" });
      }
  
      const data = await Notification.getAllNotifications(userId);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách thông báo", error: err });
    }
  },

  async getById(req, res) {
    try {
      const noti = await Notification.getNotificationById(req.params.id);
      if (!noti) {
        return res.status(404).json({ message: "Không tìm thấy thông báo" });
      }
      res.json(noti);
    } catch (err) {
      res.status(500).json({ message: "Lỗi khi lấy thông báo", error: err });
    }
  },

  async create(req, res) {
    try {
      console.log('create :' +req.body);
      await Notification.createNotification(req.body);
      res.status(201).json({ message: "Đã tạo thông báo thành công" });
    } catch (err) {
      res.status(500).json({ message: "Lỗi khi tạo thông báo", error: err });
    }
  },

  async update(req, res) {
    try {
      await Notification.updateNotification(req.params.id, req.body);
      res.json({ message: "Đã cập nhật thông báo thành công" });
    } catch (err) {
      res.status(500).json({ message: "Lỗi khi cập nhật thông báo", error: err });
    }
  },

  async remove(req, res) {
    try {
      await Notification.deleteNotification(req.params.id);
      res.json({ message: "Đã xoá thông báo thành công" });
    } catch (err) {
      res.status(500).json({ message: "Lỗi khi xoá thông báo", error: err });
    }
  },
};

module.exports = notificationController;
