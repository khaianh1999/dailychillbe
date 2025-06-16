// routes/commentRoutes.js
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục 'uploads' tồn tại
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Cấu hình lưu trữ cho Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Ảnh sẽ được lưu vào thư mục 'uploads/'
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Khởi tạo Multer với cấu hình storage
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn kích thước file 5MB
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Chỉ cho phép tải lên file ảnh (jpeg, jpg, png, gif)!'));
    }
});

// Định nghĩa các route cho Comment
router.post('/', upload.single('image'), commentController.createComment);
router.get('/', commentController.getComments);
router.get('/:id', commentController.getCommentById);
router.put('/:id', upload.single('image'), commentController.updateComment);
router.delete('/:id', commentController.deleteComment);

module.exports = router;
