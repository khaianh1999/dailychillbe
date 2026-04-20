const User = require("../models/userModel");
const mailController = require('./mailController');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserInfor = async (req, res) => {
  try {
    const user = await User.getUserInfor(req?.user?.id);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserInforAndToken = async (req, res) => {
  try {
    const userId = req.query.userId || req.userId;

    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    const user = await User.getUserInfor(userId);

    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    const payload = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(200).json({
      user,
      token_user: token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.addCode = async (req, res) => {
  const { refer_code } = req.body;
  const userId = req.user.id;

  try {
    await User.addReferCode(userId, refer_code);
    res.json({ message: "Cập nhật mã giới thiệu thành công!" });
  } catch (err) {
    switch (err.message) {
      case "NOT_FOUND":
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      case "ALREADY_SET":
        return res.status(400).json({ message: "Bạn đã nhập mã giới thiệu rồi!" });
      case "SELF_REFER":
        return res.status(400).json({ message: "Không thể nhập mã của chính bạn!" });
      case "INVALID_CODE":
        return res.status(400).json({ message: "Mã giới thiệu không hợp lệ!" });
      default:
        console.error("Lỗi hệ thống:", err);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
  }
};

exports.buyNow = async (req, res) => {
  const userId = req.user.id;
  const { email, address, phone_number, product_id } = req.body;

  try {
    const result = await User.processBuyNow(userId, {
      email,
      address,
      phone_number,
      product_id,
    });
    // Gửi mail bằng controller riêng
    await mailController.sendOrderSuccessEmail(
      "Duyệt đặt quà", `Đơn quà số ${result.id}`, "Có người dùng đổi quà") 
    res.json({ message: "Đặt quà thành công!", order: result });
  } catch (err) {
    console.error("Lỗi đặt quà:", err);
    if (err.message === "NOT_ENOUGH_COIN") {
      res.status(400).json({ message: "Bạn không đủ coin để mua sản phẩm này." });
    } else if (err.message === "PRODUCT_NOT_FOUND") {
      res.status(404).json({ message: "Sản phẩm không tồn tại." });
    } else {
      res.status(500).json({ message: "Lỗi hệ thống" });
    }
  }
};

exports.listMyOrder = async (req, res) => {
  const userId = req.user.id;

  try {
    const orders = await User.getOrdersByUserId(userId);
    res.json(orders);
  } catch (err) {
    console.error("Lỗi lấy đơn hàng:", err);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    await User.createUser(req.body);
    res.status(201).json({ message: "Tạo user thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    await User.updateUser(req.params.id, req.body);
    res.json({ message: "Cập nhật user thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.deleteUser(req.params.id);
    res.json({ message: "Xóa user thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
