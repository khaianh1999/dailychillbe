const { poolPromise, sql } = require('../config/db'); // Giả sử bạn có file config db


class Category {
    /**
     * Tạo một danh mục mới.
     * @param {object} categoryData - Dữ liệu danh mục bao gồm name, type, updated_by.
     * @returns {Promise<object>} Danh mục đã được tạo.
     */
    static async createCategory(categoryData) {
        const { name, type, updated_by } = categoryData;
        try {
            const pool = await poolPromise;
            const request = pool.request();

            request.input('name', sql.NVarChar, name);
            request.input('type', sql.NVarChar, type || null); // type có thể là NULL
            request.input('updated_by', sql.Int, updated_by || null); // updated_by có thể là NULL

            // Tách INSERT và SELECT để tránh lỗi trigger
            const insertQuery = `
                INSERT INTO categories (name, type, updated_by)
                VALUES (@name, @type, @updated_by);
                SELECT SCOPE_IDENTITY() AS id; -- Lấy ID của bản ghi vừa chèn
            `;

            const result = await request.query(insertQuery);
            const newCategoryId = result.recordset[0].id; // Lấy ID của danh mục vừa chèn

            // Lấy lại bản ghi hoàn chỉnh sau khi chèn (bao gồm cả created_at, updated_at từ trigger)
            const createdCategory = await this.getCategoryById(newCategoryId);
            return createdCategory;

        } catch (err) {
            console.error('SQL error when creating category:', err);
            throw err;
        }
    }

    /**
     * Lấy một danh mục bằng ID.
     * @param {number} id - ID của danh mục.
     * @returns {Promise<object|null>} Danh mục hoặc null nếu không tìm thấy.
     */
    static async getCategoryById(id) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT * FROM categories WHERE id = @id AND deleted = 0;');
            return result.recordset.length > 0 ? result.recordset[0] : null;
        } catch (err) {
            console.error('SQL error when fetching category by ID:', err);
            throw err;
        }
    }

    /**
     * Lấy tất cả danh mục.
     * @returns {Promise<Array<object>>} Danh sách danh mục.
     */
    static async getCategories() {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .query('SELECT * FROM categories WHERE deleted = 0 ORDER BY name ASC;');
            return result.recordset;
        } catch (err) {
            console.error('SQL error when fetching categories:', err);
            throw err;
        }
    }

    /**
     * Cập nhật một danh mục.
     * @param {number} id - ID của danh mục cần cập nhật.
     * @param {object} categoryData - Dữ liệu cập nhật.
     * @returns {Promise<object|null>} Danh mục đã được cập nhật hoặc null nếu không tìm thấy.
     */
    static async updateCategory(id, categoryData) {
        const { name, type, updated_by } = categoryData;
        try {
            const pool = await poolPromise;
            const request = pool.request();

            request.input('id', sql.Int, id);
            request.input('name', sql.NVarChar, name);
            request.input('type', sql.NVarChar, type || null);
            request.input('updated_by', sql.Int, updated_by || null);

            // Tách UPDATE và SELECT để tránh lỗi trigger
            const updateQuery = `
                UPDATE categories
                SET
                    name = @name,
                    type = @type,
                    updated_by = @updated_by
                WHERE id = @id AND deleted = 0;
            `;

            const updateResult = await request.query(updateQuery);

            // Nếu không có hàng nào được cập nhật, trả về null
            if (updateResult.rowsAffected[0] === 0) {
                return null;
            }

            // Lấy lại bản ghi đã được cập nhật
            const updatedCategory = await this.getCategoryById(id);
            return updatedCategory;

        } catch (err) {
            console.error('SQL error when updating category:', err);
            throw err;
        }
    }

    /**
     * Xóa mềm một danh mục (cập nhật cột 'deleted' thành 1).
     * @param {number} id - ID của danh mục cần xóa.
     * @returns {Promise<boolean>} True nếu xóa thành công, false nếu không tìm thấy.
     */
    static async deleteCategory(id) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query('UPDATE categories SET deleted = 1 WHERE id = @id;');
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('SQL error when soft deleting category:', err);
            throw err;
        }
    }
}

module.exports = Category;
