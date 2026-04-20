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
  // static async createUser({ FullName, Gender, BirthDate, Email, MonthlyIncome }) {
  //   const pool = await poolPromise;
  //   await pool.request()
  //     .input("FullName", sql.NVarChar, FullName)
  //     .input("Gender", sql.NVarChar, Gender)
  //     .input("BirthDate", sql.Date, BirthDate)
  //     .input("Email", sql.NVarChar, Email)
  //     .input("MonthlyIncome", sql.Decimal(18, 2), MonthlyIncome)
  //     .input("CreatedAt", sql.DateTime, new Date())
  //     .query(`
  //       INSERT INTO core_users (FullName, Gender, BirthDate, Email, MonthlyIncome, CreatedAt)
  //       VALUES (@FullName, @Gender, @BirthDate, @Email, @MonthlyIncome, @CreatedAt)
  //     `);
  // }

  static async createUser({ FullName, Gender, BirthDate, Email, MonthlyIncome }) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      const request = new sql.Request(transaction);

      // Insert vào core_users
      await request
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
      const code = generateRandomUppercaseCode(8);
      // Insert vào users
      await request
        .input("email_user", sql.NVarChar, Email)
        .input("full_name_user", sql.NVarChar, FullName)
        .input("created_user", sql.DateTime, new Date())
        .input("code", sql.NVarChar, code)
        .query(`
          INSERT INTO users (email, full_name, code, created_at)
          VALUES (@email_user, @full_name_user, @code, @created_user)
        `);

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
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

  /*
  static async findOrCreateByEmail(email) {
    const pool = await poolPromise;

    // 🔍 Tìm user theo Email
    let result = await pool.request()
      .input("email", sql.NVarChar, email)
      .query(`
        SELECT id, full_name, email
        FROM users
        WHERE email = @email
      `);

    let user = result.recordset[0];

    // Nếu không có user thì tạo mới
    if (!user) {
      const insertResult = await pool.request()
        .input("email", sql.NVarChar, email)
        .input("full_name", sql.NVarChar, email) // mặc định FullName = email
        .input("created_at", sql.DateTime, new Date())
        .input("id_fb", sql.NVarChar, null)
        .input("avatar", sql.NVarChar, "uploads/avatar.jpg")
        .input("coin", sql.Int, 0)
        .input("code", sql.NVarChar, generateRandomUppercaseCode(8))
        .query(`
          INSERT INTO users (email, full_name, created_at, id_fb, avatar, coin, code)
          OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name
          VALUES (@email, @full_name, @created_at, @id_fb, @avatar, @coin, @code)
        `);

      user = insertResult.recordset[0];

      // Tạo core_users có UserId = user.id
      const insertResultCoreUsers = await pool.request()
      .input("UserId", sql.Int, user.id)
      .input("Email", sql.NVarChar, user.email)
      .input("FullName", sql.NVarChar, user.full_name) // mặc định FullName = email
      .input("CreatedAt", sql.DateTime, new Date())

      .query(`
        INSERT INTO core_users (UserId, Email, FullName, CreatedAt)
        OUTPUT INSERTED.UserId, INSERTED.Email, INSERTED.FullName
        VALUES (@UserId, @Email, @FullName, @CreatedAt)
      `);

    }

    return {
      UserId: user.id,
      Email: user.email,
      Name: user.full_name || ""
    };
  }
  */
  static async findOrCreateByEmail(email) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
  
    try {
      // 🔍 Kiểm tra user trong bảng users
      const existingUser = await transaction.request()
        .input("email", sql.NVarChar, email)
        .query(`SELECT id, email, full_name FROM users WHERE email = @email`);
  
      let user = existingUser.recordset[0];
      let coreUserId = null;
  
      if (user) {
        // 🔍 Check core_users có record chưa
        const existingCoreUser = await transaction.request()
          .input("UserId", sql.Int, user.id)
          .query(`SELECT Id FROM core_users WHERE UserId = @UserId`);
  
        if (existingCoreUser.recordset.length === 0) {
          // ➕ Tạo mới core_users
          const insertCore = await transaction.request()
            .input("UserId", sql.Int, user.id)
            .input("Email", sql.NVarChar, user.email)
            .input("FullName", sql.NVarChar, user.full_name || email)
            .input("CreatedAt", sql.DateTime, new Date())
            .query(`
              INSERT INTO core_users (UserId, Email, FullName, CreatedAt)
              OUTPUT INSERTED.Id
              VALUES (@UserId, @Email, @FullName, @CreatedAt)
            `);
  
          coreUserId = insertCore.recordset[0].Id;
        } else {
          coreUserId = existingCoreUser.recordset[0].Id;
        }
  
        await transaction.commit();
  
        return {
          UserId: user.id,
          Email: user.email,
          Name: user.full_name,
          CoreUserId: coreUserId
        };
      }
  
      // 🆕 Nếu chưa có user thì tạo mới trong users
      const insertUser = await transaction.request()
        .input("email", sql.NVarChar, email)
        .input("full_name", sql.NVarChar, email)
        .input("created_at", sql.DateTime, new Date())
        .input("id_fb", sql.NVarChar, 'fake_id_fb')
        .input("avatar", sql.NVarChar, "uploads/avatar.jpg")
        .input("coin", sql.Int, 0)
        .input("code", sql.NVarChar, generateRandomUppercaseCode(8))
        .query(`
          INSERT INTO users (email, full_name, created_at, id_fb, avatar, coin, code)
          OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name
          VALUES (@email, @full_name, @created_at, @id_fb, @avatar, @coin, @code)
        `);
  
      user = insertUser.recordset[0];
  
      // ➕ Insert vào core_users
      const insertCore = await transaction.request()
        .input("UserId", sql.Int, user.id)
        .input("Email", sql.NVarChar, user.email)
        .input("FullName", sql.NVarChar, user.full_name)
        .input("CreatedAt", sql.DateTime, new Date())
        .query(`
          INSERT INTO core_users (UserId, Email, FullName, CreatedAt)
          OUTPUT INSERTED.Id
          VALUES (@UserId, @Email, @FullName, @CreatedAt)
        `);
  
      coreUserId = insertCore.recordset[0].Id;
  
      await transaction.commit();
  
      return {
        UserId: user.id,
        Email: user.email,
        Name: user.full_name,
        CoreUserId: coreUserId
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
  
}

function generateRandomUppercaseCode(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // Chỉ chứa chữ cái in hoa và số
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

module.exports = CoreUser;
