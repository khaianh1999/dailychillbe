const express = require("express");
const articleController = require("../controllers/articleController");
const router = express.Router();
const multer = require('multer');
const path = require('path'); // Import path module

const fs = require('fs'); // Import fs để đảm bảo thư mục uploads tồn tại
const verifyToken = require("../middleware/verifyToken");

// Đảm bảo thư mục 'uploads' tồn tại
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}



// Cấu hình lưu trữ cho Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Tạo thư mục 'uploads' nếu chưa có.
        // Bạn có thể tạo nó bằng tay hoặc đảm bảo nó được tạo tự động khi deploy.
        cb(null, 'uploads/'); // Ảnh sẽ được lưu vào thư mục 'uploads/'
    },
    filename: function (req, file, cb) {
        // Đặt tên file là duy nhất để tránh trùng lặp, ví dụ: timestamp-tên_file_gốc.ext
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Khởi tạo Multer với cấu hình storage
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn kích thước file 5MB
    fileFilter: function (req, file, cb) {
        // Chỉ cho phép các loại file ảnh
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Chỉ cho phép tải lên file ảnh (jpeg, jpg, png, gif)!'));
    }
});

// Định nghĩa route để tạo bài viết, sử dụng middleware `upload.single('image')`
// 'image' là tên của trường (field) trong form bạn gửi lên chứa file ảnh

router.post("/api", verifyToken, upload.single('image'), articleController.createArticleByClient);
router.post("/put-article", verifyToken, articleController.verifyArticleForUser);
router.get("/my-articles",verifyToken, articleController.getAllMyArticles);

router.get("/", articleController.getAllArticles);
router.get("/:id", articleController.getArticleById);
router.post("/",upload.single('image'), articleController.createArticle);
router.put("/:id", upload.single('image'), articleController.updateArticle);
router.delete("/:id", articleController.deleteArticle);

router.get("/api/", articleController.getAllArticles);
router.get("/api/:id", articleController.getArticleByIdClient);

module.exports = router;
