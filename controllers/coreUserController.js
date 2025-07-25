const CoreUser = require("../models/coreUserModel");

const coreUserController = {
    async getAllUsers(req, res) {
        try {
            const users = await CoreUser.getAllUsers();
            res.json(users);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Lỗi khi lấy danh sách user", error });
        }
    },

    async findOrCreateByEmail(req, res) {
        try {
          const { email } = req.body;
          if (!email || email.trim() === "") {
            return res.status(400).json({ error: "Email is required" });
          }
    
          const userInfo = await CoreUser.findOrCreateByEmail(email.trim());
          return res.json(userInfo);
    
        } catch (err) {
          console.error("Lỗi findOrCreateByEmail:", err);
          return res.status(500).json({ error: "Internal Server Error" });
        }
      },

    async getUserById(req, res) {
        try {
            const user = await CoreUser.getUserById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: "Không tìm thấy user" });
            }
            res.json(user);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Lỗi khi lấy thông tin user", error });
        }
    },

    async createUser(req, res) {
        try {
            await CoreUser.createUser(req.body);
            res.status(201).json({ message: "User đã được tạo" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Lỗi khi tạo user", error });
        }
    },

    async updateUser(req, res) {
        try {
            await CoreUser.updateUser(req.params.id, req.body);
            res.json({ message: "User đã được cập nhật" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Lỗi khi cập nhật user", error });
        }
    },

    async deleteUser(req, res) {
        try {
            await CoreUser.deleteUser(req.params.id);
            res.json({ message: "User đã được xóa" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Lỗi khi xóa user", error });
        }
    }
};

module.exports = coreUserController;
