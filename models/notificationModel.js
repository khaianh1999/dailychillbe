// models/notificationModel.js
const { sql, poolPromise } = require("../config/db");

class Notification {
  // Lấy tất cả thông báo
  static async getAllNotifications() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT Id, UserId, Title, Message, IsRead, CreatedAt, UpdatedAt, NotifyAt
        FROM notifications
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
          SELECT Id, UserId, Title, Message, IsRead, CreatedAt, UpdatedAt, NotifyAt
          FROM notifications
          WHERE Id = @id
        `);
      return result.recordset[0] || null;
    } catch (err) {
      throw err;
    }
  }

  // Tạo thông báo mới
  static async createNotification({ UserId, Title, Message, NotifyAt = null }) {
    try {
      const now = new Date();
      const pool = await poolPromise;
      await pool.request()
        .input("UserId", sql.Int, UserId)
        .input("Title", sql.NVarChar, Title)
        .input("Message", sql.NVarChar, Message)
        .input("IsRead", sql.Bit, false)
        .input("CreatedAt", sql.DateTime, now)
        .input("UpdatedAt", sql.DateTime, now)
        .input("NotifyAt", sql.DateTime, NotifyAt)
        .query(`
          INSERT INTO notifications (UserId, Title, Message, IsRead, CreatedAt, UpdatedAt, NotifyAt)
          VALUES (@UserId, @Title, @Message, @IsRead, @CreatedAt, @UpdatedAt, @NotifyAt)
        `);
    } catch (err) {
      throw err;
    }
  }

  // Cập nhật thông báo
  static async updateNotification(id, { Title, Message, IsRead, NotifyAt = null }) {
    try {
      const pool = await poolPromise;
      await pool.request()
        .input("id", sql.Int, id)
        .input("Title", sql.NVarChar, Title)
        .input("Message", sql.NVarChar, Message)
        .input("IsRead", sql.Bit, IsRead)
        .input("UpdatedAt", sql.DateTime, new Date())
        .input("NotifyAt", sql.DateTime, NotifyAt)
        .query(`
          UPDATE notifications
          SET Title = @Title,
              Message = @Message,
              IsRead = @IsRead,
              UpdatedAt = @UpdatedAt,
              NotifyAt = @NotifyAt
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
