const { sql, poolPromise } = require("../config/db");

class User {
    static async findOne(condition) {
        try {
            const pool = await poolPromise;
    
            if (!condition || Object.keys(condition).length === 0) {
                throw new Error("findOne() requires a valid condition object");
            }
    
            let query = "SELECT id, full_name, email, id_fb, deleted FROM users WHERE "; // Loại bỏ password
            const keys = Object.keys(condition);
            const values = Object.values(condition);
    
            query += keys.map((key, index) => `${key} = @${key}`).join(" AND ");
    
            let request = pool.request();
            keys.forEach((key, index) => {
                if (values[index] === undefined || values[index] === null) {
                    throw new Error(`Invalid value for key: ${key}`);
                }
                request = request.input(key, sql.NVarChar, values[index]);
            });
    
            const result = await request.query(query);
            return result.recordset[0] || null;
        } catch (err) {
            console.error("Error in findOne():", err.message);
            throw err;
        }
    }
    

    static async getAllUsers() {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query("SELECT id, full_name, email, id_fb, deleted FROM users"); // Loại bỏ password
            return result.recordset;
        } catch (err) {
            throw err;
        }
    }

    static async getUserById(id) {
        try {
            const pool = await poolPromise;
            const result = await pool
                .request()
                .input("id", sql.Int, id)
                .query("SELECT id, full_name, email, id_fb, deleted FROM users WHERE id = @id"); // Loại bỏ password
            return result.recordset[0];
        } catch (err) {
            throw err;
        }
    }

    static async getUserInfor(id) {
        try {
            const pool = await poolPromise;
            const result = await pool
                .request()
                .input("id", sql.Int, id)
                .query("SELECT id, full_name, coin, refer_code, code, avatar, email, id_fb, deleted FROM users WHERE id = @id"); // Loại bỏ password
            return result.recordset[0];
        } catch (err) {
            throw err;
        }
    }

    static async addReferCode(userId, refer_code) {
        const pool = await poolPromise;
    
        // Lấy user hiện tại
        const currentUser = await pool
          .request()
          .input("id", sql.Int, userId)
          .query("SELECT refer_code, code FROM users WHERE id = @id");
    
        const user = currentUser.recordset[0];
        if (!user) throw new Error("NOT_FOUND");
    
        if (user.refer_code) throw new Error("ALREADY_SET");
        if (user.code === refer_code) throw new Error("SELF_REFER");
    
        // Kiểm tra mã có tồn tại không
        const refUser = await pool
          .request()
          .input("code", sql.NVarChar, refer_code)
          .query("SELECT id FROM users WHERE code = @code");
    
        if (refUser.recordset.length === 0) throw new Error("INVALID_CODE");
    
        // Cập nhật mã giới thiệu
        await pool
          .request()
          .input("id", sql.Int, userId)
          .input("refer_code", sql.NVarChar, refer_code)
          .query("UPDATE users SET refer_code = @refer_code WHERE id = @id");

        // 4. Cộng 1 coin cho người chia sẻ mã
        await pool
        .request()
        .input("id", sql.Int, refUser.recordset[0].id)
        .query("UPDATE users SET coin = ISNULL(coin, 0) + 1 WHERE id = @id");
    
        return true;
    }
    /*
    static async processBuyNow(userId, { email, address, phone_number, product_id }) {
        const pool = await poolPromise;
      
        // Lấy thông tin sản phẩm
        const productResult = await pool
          .request()
          .input("id", sql.Int, product_id)
          .query("SELECT price FROM products WHERE id = @id AND deleted = 0");
      
        const product = productResult.recordset[0];
        if (!product) throw new Error("PRODUCT_NOT_FOUND");
      
        const price = product.price;
      
        // Lấy thông tin người dùng
        const userResult = await pool
          .request()
          .input("id", sql.Int, userId)
          .query("SELECT coin FROM users WHERE id = @id");
      
        const user = userResult.recordset[0];
        if (!user || user.coin < price) throw new Error("NOT_ENOUGH_COIN");
      
        // Cập nhật thông tin người dùng
        await pool
          .request()
          .input("id", sql.Int, userId)
          .input("email", sql.NVarChar, email)
          .input("address", sql.NVarChar, address)
          .input("phone", sql.NVarChar, phone_number)
          .query(`
            UPDATE users
            SET email = @email, address = @address, phone_number = @phone
            WHERE id = @id
          `);
      
        // Trừ coin
        await pool
          .request()
          .input("id", sql.Int, userId)
          .input("price", sql.Int, price)
          .query("UPDATE users SET coin = coin - @price WHERE id = @id");
      
        // Thêm đơn hàng
        const insertResult = await pool
          .request()
          .input("user_id", sql.Int, userId)
          .input("total_amount", sql.Int, price)
          .input("status", sql.Int, 0)
          .input("product_id", sql.Int, product_id)
          .query(`
            INSERT INTO orders (user_id, total_amount, status, product_id, created_at)
            OUTPUT inserted.*
            VALUES (@user_id, @total_amount, @status, @product_id, GETDATE())
          `);
      
        return insertResult.recordset[0];
    }
    */

    static async processBuyNow(userId, { email, address, phone_number, product_id }) {
      const pool = await poolPromise;
  
      // 1. Lấy thông tin sản phẩm
      const productResult = await pool
          .request()
          .input("id", sql.Int, product_id)
          .query("SELECT price FROM products WHERE id = @id AND deleted = 0");
  
      const product = productResult.recordset[0];
      if (!product) throw new Error("PRODUCT_NOT_FOUND");
  
      const price = product.price;
  
      // 2. Lấy thông tin người dùng
      const userResult = await pool
          .request()
          .input("id", sql.Int, userId)
          .query("SELECT coin FROM users WHERE id = @id");
  
      const user = userResult.recordset[0];
      if (!user || user.coin < price) throw new Error("NOT_ENOUGH_COIN");
  
      // 3. Cập nhật thông tin người dùng
      await pool
          .request()
          .input("id", sql.Int, userId)
          .input("email", sql.NVarChar, email)
          .input("address", sql.NVarChar, address)
          .input("phone", sql.NVarChar, phone_number)
          .query(`
              UPDATE users
              SET email = @email, address = @address, phone_number = @phone
              WHERE id = @id
          `);
  
      // 4. Trừ coin
      await pool
          .request()
          .input("id", sql.Int, userId)
          .input("price", sql.Int, price)
          .query("UPDATE users SET coin = coin - @price WHERE id = @id");
  
      // 5. Thêm đơn hàng
      await pool
          .request()
          .input("user_id", sql.Int, userId)
          .input("total_amount", sql.Int, price)
          .input("status", sql.Int, 0)
          .input("product_id", sql.Int, product_id)
          .query(`
              INSERT INTO orders (user_id, total_amount, status, product_id, created_at)
              VALUES (@user_id, @total_amount, @status, @product_id, GETDATE())
          `);
  
      // 6. Trả về thông tin user mới
      return await this.getUserInfor(userId);
  }
  
    
    static async getOrdersByUserId(userId) {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input("user_id", sql.Int, userId)
            .query(`
                SELECT o.user_id, o.total_amount, o.status, o.created_at, p.name
                FROM orders o
                LEFT JOIN products p ON p.id = o.product_id
                WHERE o.user_id = @user_id
                ORDER BY o.created_at DESC
            `);
        return result.recordset;
    }


    
    
    /* cmt k bọn n hack
    static async createUser({ full_name, email }) {
        try {
            const pool = await poolPromise;
            await pool
                .request()
                .input("full_name", sql.NVarChar, full_name)
                .input("email", sql.NVarChar, email || "") // Nếu NULL thì chèn chuỗi rỗng
                .query("INSERT INTO users (full_name, email) VALUES (@full_name, @email)");
        } catch (err) {
            throw err;
        }
    }
    */
    /*
    static async createUserByFacebook({ id_fb, full_name }) {
        try {
          const pool = await poolPromise;
          await pool
            .request()
            .input("id_fb", sql.NVarChar, id_fb)
            .input("full_name", sql.NVarChar, full_name)
            .query("INSERT INTO users (id_fb, full_name) VALUES (@id_fb, @full_name)");
          
          return { id_fb, full_name }; // Trả về user vừa tạo
        } catch (err) {
          throw err;
        }
    }
    */
    static async createUserByFacebook({ id_fb, full_name }) {
        try {
          const pool = await poolPromise;
          // Tạo code random
          const code = generateRandomUppercaseCode(8);
          // 1. Insert user mới
          await pool
            .request()
            .input("id_fb", sql.NVarChar, id_fb)
            .input("full_name", sql.NVarChar, full_name)
            .input("code", sql.NVarChar, code)
            .query("INSERT INTO users (id_fb, full_name, code, deleted) VALUES (@id_fb, @full_name, @code, NULL)");
      
          // 2. Truy vấn lại user vừa tạo (không lấy password, deleted)
          const result = await pool
            .request()
            .input("id_fb", sql.NVarChar, id_fb)
            .query(`
              SELECT id, id_fb, full_name, email, code, coin, avatar, refer_code
              FROM users
              WHERE id_fb = @id_fb
            `);
      
          return result.recordset[0]; // Trả về user
        } catch (err) {
          throw err;
        }
    }

    static async updateUser(id, { full_name, email }) {
        try {
            const pool = await poolPromise;
            await pool
                .request()
                .input("id", sql.Int, id)
                .input("full_name", sql.NVarChar, full_name)
                .input("email", sql.NVarChar, email)
                .query("UPDATE users SET full_name = @full_name, email = @email WHERE id = @id");
        } catch (err) {
            throw err;
        }
    }

    static async deleteUser(id) {
        try {
            const pool = await poolPromise;
            await pool.request()
                .input("id", sql.Int, id)
                .query("UPDATE users SET deleted = 1 WHERE id = @id");
        } catch (err) {
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

module.exports = User;
