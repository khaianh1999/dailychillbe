const express = require("express");
const coreUserController = require("../controllers/coreUserController");
const router = express.Router();

// Danh sách user
router.get("/", coreUserController.getAllUsers);

// Lấy chi tiết user
router.get("/:id", coreUserController.getUserById);

// POST /api/users/by-email
router.post('/by-email', coreUserController.findOrCreateByEmail);

// Tạo mới user
router.post("/", coreUserController.createUser);

// Cập nhật user
router.put("/:id", coreUserController.updateUser);

// Xóa user
router.delete("/:id", coreUserController.deleteUser);

module.exports = router;
