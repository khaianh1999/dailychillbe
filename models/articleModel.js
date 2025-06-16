const { poolPromise, sql } = require('../config/db'); // Giả sử bạn có file config db

class Article {
    /**
     * Lấy danh sách bài viết với tìm kiếm và phân trang
     * @param {object} queryParams - Các tham số từ request query (page, limit, searchQuery)
     */


    static async getAllArticles(queryParams = {}) {
        const page = parseInt(queryParams.page, 10) || 1;
        const limit = parseInt(queryParams.limit, 20) || 20; // Changed base 20 to 10 for consistency
        const searchQuery = queryParams.searchQuery || '';
        const categoryType = queryParams.category || ''; // Renamed to categoryType to reflect it's the 'type' column
        const status = queryParams.status || null;
        const isAdmin = queryParams.isAdmin || null;

        const offset = (page - 1) * limit;

        try {
            const pool = await poolPromise;
            const request = pool.request();
            let whereClause = "";
            if (isAdmin) { // từ admin thì lọc theo status nếu có
                whereClause = `WHERE a.deleted = 0`;

                if (status != null) { // có lọc status
                    whereClause += ` AND a.status = ${status}`;
                }
            } else {// client gọi
                whereClause = `WHERE a.deleted = 0 AND a.status = 1`;
            }

            if (searchQuery) {
                whereClause += ` AND a.title LIKE @searchPattern`;
                request.input('searchPattern', sql.NVarChar, `%${searchQuery}%`);
            }

            // --- CẬP NHẬT LOGIC LỌC THEO CATEGORY (Dựa trên cột 'type' của bảng categories) ---
            if (categoryType) {
                // Bước 1: Tìm ID của danh mục dựa trên tên Type
                whereClause += ` AND EXISTS (
                    SELECT 1 FROM categories AS c
                    WHERE c.type = @categoryType AND c.deleted = 0
                    AND ',' + a.category_ids + ',' LIKE '%,' + CAST(c.id AS NVARCHAR(MAX)) + ',%'
                )`;
                request.input('categoryType', sql.NVarChar, categoryType); // Input parameter name updated
            }
            // ----------------------------------------

            const countQuery = `SELECT COUNT(*) as totalItems FROM articles a ${whereClause}`;
            const totalResult = await request.query(countQuery);
            const totalItems = totalResult.recordset[0].totalItems;
            const totalPages = Math.ceil(totalItems / limit);

            const dataQuery = `
                SELECT a.id, u.full_name, a.title, a.image_url, a.content, a.category_ids, a.created_at, a.updated_at, a.updated_by, a.status
                FROM articles a
                LEFT JOIN users u ON u.id = a.user_id
                ${whereClause}
                ORDER BY a.created_at DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY;
            `;
            request.input('offset', sql.Int, offset);
            request.input('limit', sql.Int, limit);
            const dataResult = await request.query(dataQuery);
            
            return {
                data: dataResult.recordset,
                meta: {
                    totalItems,
                    itemsPerPage: limit,
                    currentPage: page,
                    totalPages,
                }
            };
        } catch (err) {
            console.error('SQL error in getAllArticles:', err); // Specific error log
            throw err;
        }
    }


    /**
     * Lấy chi tiết một bài viết theo ID
     * @param {number} id - ID của bài viết cần tìm
     * @returns {object|null} - Trả về đối tượng bài viết hoặc null nếu không tìm thấy
     */
    static async getArticleById(id) {
        try {
            const pool = await poolPromise;
            const query = `
                SELECT id, title, status, image_url, content, category_ids, created_at, updated_at, updated_by
                FROM articles
                WHERE id = @id AND deleted != 1;
            `;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(query);

            // recordset là một mảng, nếu có kết quả thì lấy phần tử đầu tiên
            return result.recordset.length > 0 ? result.recordset[0] : null;
        } catch (err) {
            console.error('SQL error', err);
            throw err;
        }
    }
    
    static async getArticleByIdClient(id) {
        try {
            const pool = await poolPromise;
            const query = `
                SELECT
                    a.id,
                    a.title,
                    a.image_url,
                    a.content,
                    a.category_ids,
                    a.created_at,
                    a.updated_at,
                    a.updated_by,
                    a.status,
                    us.full_name,
                    us.id AS user_id_author,
                    -- Subquery to fetch comments related to this article
                    (
                        SELECT
                            c.id,
                            c.content,
                            c.image_url,
                            c.parent_id,
                            c.user_id,
                            u.full_name AS user_full_name, -- Full name of the comment author
                            pc.full_name AS parent_full_name, -- Full name of the parent comment's author
                            c.created_at,
                            c.updated_at,
                            c.updated_by
                        FROM comments AS c
                        LEFT JOIN users AS u ON c.user_id = u.id -- Join to get author's full name
                        LEFT JOIN comments AS parent_comment_obj ON c.parent_id = parent_comment_obj.id -- Self-join for parent comment object
                        LEFT JOIN users AS pc ON parent_comment_obj.user_id = pc.id -- Join to get parent comment author's full name
                        WHERE c.article_id = a.id AND c.deleted != 1 AND a.status = 1
                        ORDER BY id DESC
                        FOR JSON PATH -- Formats comments as a JSON array
                    ) AS comments_json
                FROM articles AS a
                LEFT JOIN users AS us ON a.user_id = us.id
                WHERE a.id = @id AND a.deleted = 0;
            `;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(query);

            if (result.recordset.length === 0) {
                return null; // Article not found
            }

            const article = result.recordset[0];

            // Parse the comments_json string into a JavaScript array
            if (article.comments_json) {
                article.comments = JSON.parse(article.comments_json);
            } else {
                article.comments = []; // If no comments, ensure it's an empty array
            }
            delete article.comments_json; // Remove the raw JSON string

            return article;
        } catch (err) {
            console.error('SQL error when fetching article by ID for client:', err);
            throw err;
        }
    }


    /**
     * Tạo một bài viết mới
     * @param {object} articleData - Dữ liệu của bài viết mới
     * @returns {object} - Trả về bài viết vừa được tạo
     */
    static async createArticle(articleData) {
        const { title, image_url, content, category_ids, updated_by, status } = articleData;
        try {
            const pool = await poolPromise;
            const request = pool.request();

            request.input('title', sql.NVarChar, title);
            request.input('content', sql.NVarChar, content);
            request.input('category_ids', sql.NVarChar, category_ids);
            request.input('updated_by', sql.Int, updated_by);
            request.input('status', sql.Int, status);

            // Xử lý image_url: nếu null hoặc undefined, sẽ lưu NULL vào DB
            if (image_url) {
                request.input('image_url', sql.NVarChar, image_url);
            } else {
                request.input('image_url', sql.NVarChar, null); // Hoặc bạn có thể dùng sql.VarChar(sql.MAX)
            }

            const query = `
                INSERT INTO articles (title, image_url, content, category_ids, updated_by, status)
                OUTPUT inserted.*
                VALUES (@title, @image_url, @content, @category_ids, @updated_by, @status);
            `;
            const result = await request.query(query);

            return result.recordset[0];
        } catch (err) {
            console.error('SQL error when creating article:', err);
            throw err;
        }
    }


    static async createArticleByClient(articleData) {
        const { user_id, title, image_url, content, category_ids, updated_by } = articleData;
        try {
            const pool = await poolPromise;
            const request = pool.request();

            request.input('title', sql.NVarChar, title);
            request.input('content', sql.NVarChar, content);
            request.input('category_ids', sql.NVarChar, category_ids);
            request.input('updated_by', sql.Int, updated_by);
            request.input('user_id', sql.Int, user_id);
            // Xử lý image_url: nếu null hoặc undefined, sẽ lưu NULL vào DB
            if (image_url) {
                request.input('image_url', sql.NVarChar, image_url);
            } else {
                request.input('image_url', sql.NVarChar, null); // Hoặc bạn có thể dùng sql.VarChar(sql.MAX)
            }

            const query = `
                INSERT INTO articles (user_id, title, image_url, content, category_ids, updated_by, status)
                OUTPUT inserted.*
                VALUES (@user_id, @title, @image_url, @content, @category_ids, @updated_by, 0);
            `;
            const result = await request.query(query);

            return result.recordset[0];
        } catch (err) {
            console.error('SQL error when creating article:', err);
            throw err;
        }
    }

    /**
     * Cập nhật một bài viết
     * @param {number} id - ID của bài viết cần cập nhật
     * @param {object} articleData - Dữ liệu mới của bài viết
     * @returns {object|null} - Trả về bài viết đã được cập nhật hoặc null nếu không tìm thấy
     */
    static async updateArticle (id, articleData) {
        const { title, image_url, content, category_ids, updated_by } = articleData;
        try {
            const pool = await poolPromise;
            const request = pool.request();

            request.input('id', sql.Int, id);
            request.input('title', sql.NVarChar, title);
            request.input('content', sql.NVarChar, content);
            request.input('category_ids', sql.NVarChar, category_ids);
            request.input('updated_by', sql.Int, updated_by);

            // Xử lý input cho image_url
            if (image_url === undefined) {
                // Nếu image_url không được gửi trong articleData, KHÔNG thay đổi nó trong DB.
                // Điều này đòi hỏi câu query UPDATE phải được xây dựng động.
                // Tuy nhiên, với cấu trúc hiện tại, chúng ta luôn SET image_url.
                // Do đó, nếu bạn muốn giữ nguyên image_url, controller phải gửi lại giá trị cũ.
                // Hoặc nếu image_url là NULL, controller gửi NULL.
                // Ở đây, chúng ta sẽ giả định controller đã xử lý giá trị image_url đúng đắn.
                request.input('image_url', sql.NVarChar, null); // Mặc định nếu không có giá trị
            } else if (image_url !== null) {
                request.input('image_url', sql.NVarChar, image_url);
            } else {
                request.input('image_url', sql.NVarChar, null); // Lưu NULL vào DB nếu muốn xóa ảnh
            }


            // Câu lệnh UPDATE không sử dụng OUTPUT inserted.*
            const updateQuery = `
                UPDATE articles
                SET
                    title = @title,
                    image_url = @image_url,
                    content = @content,
                    category_ids = @category_ids,
                    updated_by = @updated_by
                WHERE id = @id AND deleted = 0;
            `;

            await request.query(updateQuery);

            // Sau khi UPDATE thành công, thực hiện SELECT để lấy bản ghi đã cập nhật
            const selectQuery = `
                SELECT * FROM articles WHERE id = @id AND deleted = 0;
            `;
            const result = await request.query(selectQuery);

            return result.recordset.length > 0 ? result.recordset[0] : null;
        } catch (err) {
            console.error('SQL error when updating article:', err);
            throw err;
        }
    }

    static async updateArticleForUser (id, articleData) {
        const { status, updated_by } = articleData;
        try {
            const pool = await poolPromise;
            const request = pool.request();

            request.input('id', sql.Int, id);
            request.input('status', sql.Int, status);
            request.input('updated_by', sql.Int, updated_by);
            // Câu lệnh UPDATE không sử dụng OUTPUT inserted.*
            const updateQuery = `
                UPDATE articles
                SET
                    status = @status,
                    updated_by = @updated_by
                WHERE id = @id AND deleted = 0;
            `;

            await request.query(updateQuery);

            // Sau khi UPDATE thành công, thực hiện SELECT để lấy bản ghi đã cập nhật
            const selectQuery = `
                SELECT * FROM articles WHERE id = @id AND deleted = 0;
            `;
            const result = await request.query(selectQuery);
            // Tăng 1 coin cho user_id của bài viết 
            const author = result.recordset[0].user_id;
            // 4. Cộng 1 coin cho người viết bài
            await pool
            .request()
            .input("author_id", sql.Int, author)
            .query("UPDATE users SET coin = ISNULL(coin, 0) + 1 WHERE id = @author_id");

            return result.recordset.length > 0 ? result.recordset[0] : null;
        } catch (err) {
            console.error('SQL error when updating article:', err);
            throw err;
        }
    }

    /**
     * Xóa mềm một bài viết
     * @param {number} id - ID của bài viết cần xóa
     * @returns {number} - Trả về số lượng dòng bị ảnh hưởng (1 nếu thành công, 0 nếu thất bại)
     */
    static async deleteArticle(id) {
        try {
            const pool = await poolPromise;
            // Đây là xóa mềm, chỉ cập nhật cờ "deleted" thành 1
            const query = `
                UPDATE articles
                SET deleted = 1
                WHERE id = @id;
            `;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(query);

            // rowsAffected là mảng chứa số dòng bị ảnh hưởng bởi từng câu lệnh
            return result.rowsAffected[0];
        } catch (err) {
            console.error('SQL error', err);
            throw err;
        }
    }
}

module.exports = Article;