const Article = require("../models/articleModel");
const fs = require('fs'); // Import fs để xử lý xóa file nếu có lỗi
const path = require('path');
const mailController = require('./mailController');
require("dotenv").config(); // Đảm bảo biến môi trường được load

const articleController = {
    async getAllArticles(req, res) {
        try {
            const result = await Article.getAllArticles(req.query);
            res.status(200).json(result);
        } catch (err) {
            res.status(500).json({ message: 'Lỗi khi lấy danh sách bài viết', error: err.message });
        }
    },
    async getAllMyArticles(req, res) {
        try {
            const user_id = req.user.id;
            if (!user_id) {
                res.status(500).json({ message: 'Lỗi lấy danh sách bài viết', error: "Lỗi token" });
                return;
            }
            const result = await Article.getAllMyArticles(req.query, user_id);
            res.status(200).json(result);
        } catch (err) {
            res.status(500).json({ message: 'Lỗi khi lấy danh sách bài viết', error: err.message });
        }
    },

    async getArticleById(req, res) {
        try {
            const { id } = req.params;
            const article = await Article.getArticleById(id);
            if (!article) {
                return res.status(404).json({ message: 'Không tìm thấy bài viết' });
            }
            res.status(200).json(article);
        } catch (err) {
            res.status(500).json({ message: 'Lỗi khi lấy chi tiết bài viết', error: err.message });
        }
    },
  
    async getArticleByIdClient (req, res) {
        try {
            const { id } = req.params;
            const article = await Article.getArticleByIdClient(parseInt(id));
            if (!article) {
                return res.status(404).json({ message: 'Không tìm thấy bài viết' });
            }
            res.status(200).json({ message: 'Lấy bài viết và bình luận thành công', data: article });
        } catch (err) {
            console.error('Lỗi khi lấy bài viết và bình luận:', err);
            res.status(500).json({ message: 'Lỗi khi lấy bài viết và bình luận', error: err.message });
        }
    },

    

    async createArticle(req, res) {
        try {
            // req.file chứa thông tin về file đã tải lên (nếu có)
            // req.body chứa các dữ liệu text khác từ form
            const { title, content, category_ids, updated_by } = req.body;
            let image_url = null;
    
            if (req.file) {
                // Lấy đường dẫn của file đã lưu bởi Multer
                image_url = req.file.path; // Ví dụ: 'uploads/1678901234567-myimage.jpg'
            }
    
            // Chuẩn bị dữ liệu để gửi vào model
            const articleData = {
                title,
                image_url, // Đường dẫn ảnh hoặc null
                content,
                category_ids,
                updated_by: parseInt(updated_by) ?? 1, // Đảm bảo updated_by là số nguyên
                status: 1, // admin đăng thì public luôn
            };
    
            const newArticle = await Article.createArticle(articleData);
            res.status(201).json({ message: 'Tạo bài viết thành công', data: newArticle });
        } catch (err) {
            // Nếu có lỗi trong quá trình xử lý database, hãy xóa file đã tải lên
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) console.error('Lỗi khi xóa file ảnh:', unlinkErr);
                });
            }
            console.error('Lỗi khi tạo bài viết:', err);
            writeErrorLog(err); // <<< Ghi lỗi ra file logs/error.log
            res.status(500).json({ message: 'Lỗi khi tạo bài viết', error: err.message });
        }
    },

    async createArticleByClient(req, res) {
        try {
            // req.file chứa thông tin về file đã tải lên (nếu có)
            // req.body chứa các dữ liệu text khác từ form
            const { title, content, category_ids, updated_by } = req.body;
            let image_url = null;
            const user_id = req.user.id;
            if (!user_id) {
                res.status(500).json({ message: 'Lỗi khi tạo bài viết', error: "Lỗi token" });
                return;
            }
    
            if (req.file) {
                // Lấy đường dẫn của file đã lưu bởi Multer
                image_url = req.file.path; // Ví dụ: 'uploads/1678901234567-myimage.jpg'
            }
    
            // Chuẩn bị dữ liệu để gửi vào model
            const articleData = {
                user_id,
                title,
                image_url, // Đường dẫn ảnh hoặc null
                content,
                category_ids,
                updated_by: parseInt(updated_by) ?? 1 // Đảm bảo updated_by là số nguyên
            };
    
            const newArticle = await Article.createArticleByClient(articleData);
            const DOMAIN =process.env.DOMAIN_FE;
            await mailController.sendOrderSuccessEmail(
                "Duyệt bài đăng", `Bài đăng của người dùng ${user_id} - Nội dung : ${newArticle.title}`, `<a href="${DOMAIN}/admin_setting/articles/${newArticle.id}">Đi đến màn duyệt bài đăng</a>`) 
            res.status(201).json({ message: 'Tạo bài viết thành công, vui lòng chờ duyệt', data: newArticle });
        } catch (err) {
            // Nếu có lỗi trong quá trình xử lý database, hãy xóa file đã tải lên
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) console.error('Lỗi khi xóa file ảnh:', unlinkErr);
                });
            }
            console.error('Lỗi khi tạo bài viết:', err);
            res.status(500).json({ message: 'Lỗi khi tạo bài viết', error: err.message });
        }
    },

    async verifyArticleForUser(req, res) {
        try {
            // req.file chứa thông tin về file đã tải lên (nếu có)
            // req.body chứa các dữ liệu text khác từ form
        
            const { article_id } = req.body;
            const user_id = req.user.id;
            if (!user_id) {
                res.status(500).json({ message: 'Chưa đăng nhập! Lỗi khi duyệt bài viết', error: "Lỗi token" });
                return;
            }
    
            // 1. Lấy thông tin bài viết hiện tại để có đường dẫn ảnh cũ
            const existingArticle = await Article.getArticleById(article_id);
            if (!existingArticle) {
                return res.status(404).json({ message: 'Không tìm thấy bài viết để cập nhật' });
            }
            if (existingArticle.status != 0) {
                return res.status(404).json({ message: 'Bài viết đã được duyệt rồi !' });
            }

            // 3. Chuẩn bị dữ liệu để gửi vào model
            const articleData = {
                status : 1,
                updated_by: parseInt(user_id)
            };
    
            // 4. Gọi model để cập nhật database
            const updatedArticle = await Article.updateArticleForUser(article_id, articleData);
        
            res.status(200).json({ message: 'Cập nhật bài viết thành công', data: updatedArticle });
            
        } catch (err) {
            res.status(500).json({ message: 'Catch Lỗi khi duyệt bài viết', error: err.message });
        }
    },

    async updateArticle(req, res) {
        try {
            const { id } = req.params;
            const { title, content, category_ids, updated_by } = req.body;
    
            // 1. Lấy thông tin bài viết hiện tại để có đường dẫn ảnh cũ
            const existingArticle = await Article.getArticleById(id);
            if (!existingArticle) {
                // Nếu không tìm thấy bài viết, xóa file mới tải lên (nếu có)
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlink(req.file.path, (unlinkErr) => {
                        if (unlinkErr) console.error('Lỗi khi xóa file ảnh không sử dụng (update):', unlinkErr);
                    });
                }
                return res.status(404).json({ message: 'Không tìm thấy bài viết để cập nhật' });
            }
    
            let new_image_url_to_save = existingArticle.image_url; // Mặc định giữ ảnh cũ
    
            // 2. Xử lý file ảnh mới (nếu có) hoặc yêu cầu xóa ảnh cũ
            if (req.file) {
                // Có file ảnh mới được tải lên
                new_image_url_to_save = req.file.path;
    
                // Xóa ảnh cũ nếu nó tồn tại và không phải là ảnh mặc định/placeholder
                if (existingArticle.image_url && fs.existsSync(existingArticle.image_url)) {
                    fs.unlink(existingArticle.image_url, (unlinkErr) => {
                        if (unlinkErr) console.error('Lỗi khi xóa file ảnh cũ:', unlinkErr);
                    });
                }
            } else if (req.body.remove_image === 'true' || req.body.image_url === '') {
                // Không có file mới, nhưng client yêu cầu xóa ảnh hiện tại
                new_image_url_to_save = null; // Đặt thành NULL trong DB
    
                // Xóa ảnh cũ nếu nó tồn tại
                if (existingArticle.image_url && fs.existsSync(existingArticle.image_url)) {
                    fs.unlink(existingArticle.image_url, (unlinkErr) => {
                        if (unlinkErr) console.error('Lỗi khi xóa file ảnh cũ (yêu cầu xóa):', unlinkErr);
                    });
                }
            }
            // Nếu không có req.file và không có yêu cầu xóa ảnh, new_image_url_to_save vẫn giữ nguyên giá trị từ existingArticle.image_url
    
            // 3. Chuẩn bị dữ liệu để gửi vào model
            const articleData = {
                title,
                image_url: new_image_url_to_save,
                content,
                category_ids,
                updated_by: parseInt(updated_by)
            };
    
            // 4. Gọi model để cập nhật database
            const updatedArticle = await Article.updateArticle(id, articleData);
    
            res.status(200).json({ message: 'Cập nhật bài viết thành công', data: updatedArticle });
        } catch (err) {
            // Nếu có lỗi trong quá trình cập nhật DB, xóa file mới tải lên (nếu có)
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) console.error('Lỗi khi xóa file ảnh mới tải lên sau lỗi DB (update):', unlinkErr);
                });
            }
            console.error('Lỗi khi cập nhật bài viết:', err);
            res.status(500).json({ message: 'Lỗi khi cập nhật bài viết', error: err.message });
        }
    },

    async deleteArticle(req, res) {
        try {
            const { id } = req.params;
            const rowsAffected = await Article.deleteArticle(id);
            if (rowsAffected === 0) {
                return res.status(404).json({ message: 'Không tìm thấy bài viết để xóa' });
            }
            res.status(200).json({ message: 'Xóa bài viết thành công' });
        } catch (err) {
            res.status(500).json({ message: 'Lỗi khi xóa bài viết', error: err.message });
        }
    }
};

function writeErrorLog(error) {
    const logDir = path.join(__dirname, 'logs');
    const logFile = path.join(logDir, 'error.log');
    const timestamp = new Date().toISOString();
    const logContent = `[${timestamp}] ${error.stack || error}\n\n`;

    // Tạo thư mục logs nếu chưa tồn tại
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }

    // Ghi lỗi vào file error.log
    fs.appendFile(logFile, logContent, (err) => {
        if (err) console.error('Không thể ghi log lỗi:', err);
    });
}

module.exports = articleController;
