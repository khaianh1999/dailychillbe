const { poolPromise, sql } = require('../config/db'); // Giả sử bạn có file config db

class Comment {
    /**
     * Creates a new comment.
     * @param {object} commentData - Comment data including content, image_url, parent_id, user_id, article_id, updated_by.
     * @returns {Promise<object>} The created comment.
     */
    static async createComment(commentData) {
        const { content, image_url, parent_id, user_id, article_id, updated_by } = commentData;
        try {
            const pool = await poolPromise;
            const request = pool.request();

            request.input('content', sql.NVarChar, content);
            request.input('user_id', sql.Int, user_id);
            request.input('article_id', sql.Int, article_id); // Add article_id input
            request.input('parent_id', sql.Int, parent_id || null); // Parent ID can be NULL
            request.input('image_url', sql.NVarChar, image_url || null); // Image URL can be NULL
            request.input('updated_by', sql.Int, updated_by || user_id); // Default updated_by to user_id if not provided

            // Separate INSERT and SELECT to avoid trigger issues
            const insertQuery = `
                INSERT INTO comments (content, image_url, parent_id, user_id, article_id, updated_by)
                VALUES (@content, @image_url, @parent_id, @user_id, @article_id, @updated_by);
                SELECT SCOPE_IDENTITY() AS id; -- Get the ID of the newly inserted record
            `;

            const result = await request.query(insertQuery);
            const newCommentId = result.recordset[0].id; // Get the ID of the newly inserted comment

            // Retrieve the complete record after insertion (including created_at, updated_at from trigger)
            const createdComment = await this.getCommentById(newCommentId);
            return createdComment;

        } catch (err) {
            console.error('SQL error when creating comment:', err);
            throw err;
        }
    }

    /**
     * Retrieves a comment by ID, joining with articles table and users table.
     * Also self-joins comments to get parent comment's user full_name.
     * @param {number} id - ID of the comment.
     * @returns {Promise<object|null>} The comment with article info, user full_name, and parent user full_name, or null if not found.
     */
    static async getCommentById(id) {
        try {
            const pool = await poolPromise;
            const query = `
                SELECT
                    c.*,
                    a.title AS article_title,
                    a.image_url AS article_image_url,
                    a.content AS article_content,
                    u.full_name AS user_full_name, -- Lấy full_name của người tạo comment
                    pu.full_name AS parent_full_name -- Lấy full_name của người tạo comment cha
                    -- Add other article columns if needed
                FROM comments AS c
                LEFT JOIN articles AS a ON c.article_id = a.id
                LEFT JOIN users AS u ON c.user_id = u.id -- Join với bảng users cho người tạo comment
                LEFT JOIN comments AS pc ON c.parent_id = pc.id -- Self-join với comments cho comment cha
                LEFT JOIN users AS pu ON pc.user_id = pu.id -- Join với users cho người tạo comment cha
                WHERE c.id = @id AND c.deleted = 0;
            `;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(query);
            return result.recordset.length > 0 ? result.recordset[0] : null;
        } catch (err) {
            console.error('SQL error when fetching comment by ID:', err);
            throw err;
        }
    }

    /**
     * Retrieves all comments (can be filtered by parent_id or article_id if needed).
     * Joins with articles table, users table, and self-joins comments for parent user full_name.
     * @param {object} [filters] - Object containing filters (e.g., { parent_id: 1, article_id: 10 }).
     * @returns {Promise<Array<object>>} List of comments with article information, user full_name, and parent user full_name.
     */
    static async getComments(filters = {}) {
        try {
            const pool = await poolPromise;
            const request = pool.request();
            let query = `
                SELECT
                    c.*,
                    a.title AS article_title,
                    a.image_url AS article_image_url,
                    a.content AS article_content,
                    u.full_name AS user_full_name, -- Lấy full_name của người tạo comment
                    pu.full_name AS parent_full_name -- Lấy full_name của người tạo comment cha
                    -- Add other article columns if needed
                FROM comments AS c
                LEFT JOIN articles AS a ON c.article_id = a.id
                LEFT JOIN users AS u ON c.user_id = u.id -- Join với bảng users cho người tạo comment
                LEFT JOIN comments AS pc ON c.parent_id = pc.id -- Self-join với comments cho comment cha
                LEFT JOIN users AS pu ON pc.user_id = pu.id -- Join với users cho người tạo comment cha
                WHERE c.deleted = 0
                ORDER BY id DESC
            `;

            if (filters.parent_id !== undefined && filters.parent_id !== null) {
                query += ' AND c.parent_id = @parent_id';
                request.input('parent_id', sql.Int, filters.parent_id);
            }
            if (filters.article_id !== undefined && filters.article_id !== null) {
                query += ' AND c.article_id = @article_id';
                request.input('article_id', sql.Int, filters.article_id);
            }
            // Default sort by newest created_at
            query += ' ORDER BY c.created_at DESC';

            const result = await request.query(query);
            return result.recordset;
        } catch (err) {
            console.error('SQL error when fetching comments:', err);
            throw err;
        }
    }

    /**
     * Updates an existing comment.
     * @param {number} id - ID of the comment to update.
     * @param {object} commentData - Data to update.
     * @returns {Promise<object|null>} The updated comment or null if not found.
     */
    static async updateComment(id, commentData) {
        const { content, image_url, parent_id, user_id, article_id, updated_by } = commentData;
        try {
            const pool = await poolPromise;
            const request = pool.request();

            request.input('id', sql.Int, id);
            request.input('content', sql.NVarChar, content);
            request.input('user_id', sql.Int, user_id); // Keep the original user_id
            request.input('article_id', sql.Int, article_id); // Keep the original article_id
            request.input('parent_id', sql.Int, parent_id || null);
            request.input('image_url', sql.NVarChar, image_url || null);
            request.input('updated_by', sql.Int, updated_by || user_id);

            // Separate UPDATE and SELECT to avoid trigger issues
            const updateQuery = `
                UPDATE comments
                SET
                    content = @content,
                    image_url = @image_url,
                    parent_id = @parent_id,
                    user_id = @user_id, -- Keep original user_id
                    article_id = @article_id, -- Keep original article_id
                    updated_by = @updated_by
                WHERE id = @id AND deleted = 0;
            `;

            const updateResult = await request.query(updateQuery);

            // If no rows were affected, return null
            if (updateResult.rowsAffected[0] === 0) {
                return null;
            }

            // Retrieve the updated record (including article info, user full_name, parent user full_name)
            const updatedComment = await this.getCommentById(id);
            return updatedComment;

        } catch (err) {
            console.error('SQL error when updating comment:', err);
            throw err;
        }
    }

    /**
     * Soft deletes a comment (updates 'deleted' column to 1).
     * @param {number} id - ID of the comment to delete.
     * @returns {Promise<boolean>} True if deletion was successful, false if not found.
     */
    static async deleteComment(id) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query('UPDATE comments SET deleted = 1 WHERE id = @id;');
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('SQL error when soft deleting comment:', err);
            throw err;
        }
    }
}
module.exports = Comment;
