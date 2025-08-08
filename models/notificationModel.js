// models/notificationModel.js
const { sql, poolPromise } = require("../config/db");
const { toVNDate } = require('../utils/time');

class Notification {
  // Lấy tất cả thông báo
  static async getAllNotifications(userId) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input("UserId", sql.Int, userId)
        .query(`
          SELECT Id, UserId, Title, Message, IsRead, CreatedAt, UpdatedAt, NotifyAt, Type
          FROM notifications
          WHERE UserId = @UserId
          ORDER BY CreatedAt DESC
        `);
      return result.recordset;
    } catch (err) {
      throw err;
    }
  }

  // Lấy thông báo theo ID
  static async getNotificationById(id) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input("id", sql.Int, id)
        .query(`
          SELECT Id, UserId, Title, Message, IsRead, CreatedAt, UpdatedAt, NotifyAt, Type
          FROM notifications
          WHERE Id = @id
        `);
      return result.recordset[0] || null;
    } catch (err) {
      throw err;
    }
  }

  // Tạo thông báo mới
  static async createNotification({ UserId, Title, Message, NotifyAt = null, Type = 1 }) {
    try {
      console.log('NotifyAt :' + NotifyAt);
      // Đảm bảo NotifyAt là giờ Việt Nam
      const notifyAtVN = NotifyAt ? toVNDate(NotifyAt) : null; 
      console.log('notifyAtVN :' + notifyAtVN);
      const now = new Date();
      const pool = await poolPromise;
      await pool.request()
        .input("UserId", sql.Int, UserId)
        .input("Title", sql.NVarChar, Title)
        .input("Message", sql.NVarChar, Message)
        .input("IsRead", sql.Bit, false)
        .input("CreatedAt", sql.DateTime, now)
        .input("UpdatedAt", sql.DateTime, now)
        .input("NotifyAt", sql.DateTime, notifyAtVN)
        .input("Type", sql.Int, Type)
        .query(`
          INSERT INTO notifications (UserId, Title, Message, IsRead, CreatedAt, UpdatedAt, NotifyAt, Type)
          VALUES (@UserId, @Title, @Message, @IsRead, @CreatedAt, @UpdatedAt, @NotifyAt, @Type)
        `);
    } catch (err) {
      throw err;
    }
  }

  // Cập nhật thông báo
  static async updateNotification(id, { Title, Message, IsRead, NotifyAt = null, Type = 1 }) {
    try {
      // Đảm bảo NotifyAt là giờ Việt Nam
      const notifyAtVN = NotifyAt ? toVNDate(NotifyAt) : null;
      console.log("notifyAtVN :", notifyAtVN);
      const pool = await poolPromise;
      await pool.request()
        .input("id", sql.Int, id)
        .input("Title", sql.NVarChar, Title)
        .input("Message", sql.NVarChar, Message)
        .input("IsRead", sql.Bit, IsRead)
        .input("UpdatedAt", sql.DateTime, new Date())
        .input("NotifyAt", sql.DateTime, notifyAtVN)
        .input("Type", sql.Int, Type)
        .query(`
          UPDATE notifications
          SET Title = @Title,
              Message = @Message,
              IsRead = @IsRead,
              UpdatedAt = @UpdatedAt,
              NotifyAt = @NotifyAt,
              Type = @Type
          WHERE Id = @id
        `);
    } catch (err) {
      throw err;
    }
  }

  // Xoá thông báo
  static async deleteNotification(id) {
    try {
      const pool = await poolPromise;
      await pool.request()
        .input("id", sql.Int, id)
        .query("DELETE FROM notifications WHERE Id = @id");
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Notification;
