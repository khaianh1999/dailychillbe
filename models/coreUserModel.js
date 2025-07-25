const { sql, poolPromise } = require("../config/db");

class CoreUser {
  // Lấy danh sách tất cả user
  static async getAllUsers() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT UserId, FullName, Gender, BirthDate, Email, MonthlyIncome, CreatedAt
      FROM core_users
    `);
    return result.recordset;
  }

  // Lấy chi tiết 1 user
  static async getUserById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("UserId", sql.Int, id)
      .query(`
        SELECT UserId, FullName, Gender, BirthDate, Email, MonthlyIncome, CreatedAt
        FROM core_users
        WHERE UserId = @UserId
      `);

    return result.recordset[0] || null;
  }

  // Tạo mới user
  static async createUser({ FullName, Gender, BirthDate, Email, MonthlyIncome }) {
    const pool = await poolPromise;
    await pool.request()
      .input("FullName", sql.NVarChar, FullName)
      .input("Gender", sql.NVarChar, Gender)
      .input("BirthDate", sql.Date, BirthDate)
      .input("Email", sql.NVarChar, Email)
      .input("MonthlyIncome", sql.Decimal(18, 2), MonthlyIncome)
      .input("CreatedAt", sql.DateTime, new Date())
      .query(`
        INSERT INTO core_users (FullName, Gender, BirthDate, Email, MonthlyIncome, CreatedAt)
        VALUES (@FullName, @Gender, @BirthDate, @Email, @MonthlyIncome, @CreatedAt)
      `);
  }

  // Cập nhật user
  static async updateUser(id, { FullName, Gender, BirthDate, Email, MonthlyIncome }) {
    const pool = await poolPromise;
    await pool.request()
      .input("UserId", sql.Int, id)
      .input("FullName", sql.NVarChar, FullName)
      .input("Gender", sql.NVarChar, Gender)
      .input("BirthDate", sql.Date, BirthDate)
      .input("Email", sql.NVarChar, Email)
      .input("MonthlyIncome", sql.Decimal(18, 2), MonthlyIncome)
      .query(`
        UPDATE core_users
        SET FullName = @FullName,
            Gender = @Gender,
            BirthDate = @BirthDate,
            Email = @Email,
            MonthlyIncome = @MonthlyIncome
        WHERE UserId = @UserId
      `);
  }

  // Xóa user
  static async deleteUser(id) {
    const pool = await poolPromise;
    await pool.request()
      .input("UserId", sql.Int, id)
      .query("DELETE FROM core_users WHERE UserId = @UserId");
  }

  
  static async findOrCreateByEmail(email) {
    const pool = await poolPromise;

    // 🔍 Tìm user theo Email
    let result = await pool.request()
      .input("Email", sql.NVarChar, email)
      .query(`
        SELECT UserId, FullName, Email
        FROM core_users
        WHERE Email = @Email
      `);

    let user = result.recordset[0];

    // Nếu không có user thì tạo mới
    if (!user) {
      const insertResult = await pool.request()
        .input("Email", sql.NVarChar, email)
        .input("FullName", sql.NVarChar, email) // mặc định FullName = email
        .input("CreatedAt", sql.DateTime, new Date())
        .query(`
          INSERT INTO core_users (Email, FullName, CreatedAt)
          OUTPUT INSERTED.UserId, INSERTED.Email, INSERTED.FullName
          VALUES (@Email, @FullName, @CreatedAt)
        `);

      user = insertResult.recordset[0];
    }

    return {
      UserId: user.UserId,
      Email: user.Email,
      Name: user.FullName || ""
    };
  }
}

module.exports = CoreUser;
