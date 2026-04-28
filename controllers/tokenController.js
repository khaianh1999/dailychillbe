const Token = require("../models/tokenModel");
const Price = require("../models/priceModel");
const { calculateExpirationDate, generateRandomString } = require("../utils/time");
const dayjs = require("dayjs");

exports.checkToken = async (req, res) => {
    try {
        const tokenString = req.query.token;

        if (!tokenString) {
            return res.status(400).json({ success: false, message: "Vui lòng truyền lên mã token (?token=...)" });
        }

        const tokenData = await Token.getByTokenString(tokenString);
        if (!tokenData) {
            return res.status(404).json({ success: false, message: "Token không tồn tại trong hệ thống" });
        }

        if (tokenData.status !== 1) {
            return res.status(403).json({ success: false, message: "Token này không còn hoạt động" });
        }

        const now = dayjs();
        const expiredTime = dayjs(tokenData.expired_at);
        
        if (now.isAfter(expiredTime)) {
            return res.status(400).json({ success: false, message: "Token đã hết hạn sử dụng" });
        }

        res.status(200).json({ 
            success: true, 
            message: "Token hợp lệ", 
            data: tokenData 
        });

    } catch (error) {
        console.error("Lỗi get checkToken:", error);
        res.status(500).json({ success: false, message: "Lỗi Server Internal" });
    }
};

exports.checkSubscriptionByPhone = async (req, res) => {
    try {
        const phone = req.query.phone;
        if (!phone) {
            return res.status(400).json({ success: false, message: "Vui lòng truyền lên số điện thoại (?phone=...)" });
        }

        const tokens = await Token.getByPhone(phone);
        if (!tokens || tokens.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy gói đăng ký nào cho số điện thoại này" });
        }

        // Map data to check expiration
        const now = dayjs();
        const data = tokens.map(token => {
            const expiredTime = dayjs(token.expired_at);
            const isExpired = now.isAfter(expiredTime);
            return {
                ...token,
                is_expired: isExpired
            };
        });

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Lỗi get checkSubscriptionByPhone:", error);
        res.status(500).json({ success: false, message: "Lỗi Server Internal" });
    }
};

exports.getAll = async (req, res) => {
    try {
        const data = await Token.getAll();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { phone, price_id } = req.body;

        if (!phone || !price_id) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp phone và price_id" });
        }

        const priceData = await Price.getById(price_id);
        if (!priceData) {
            return res.status(404).json({ success: false, message: "Không tìm thấy thông tin giá (price_id không hợp lệ)" });
        }

        const tokenString = generateRandomString(30);
        const expired_at = calculateExpirationDate(priceData.duration_days);

        const tokenData = {
            subscription_id: priceData.subscription_id,
            phone,
            token: tokenString,
            expired_at,
            status: 1
        };

        const data = await Token.create(tokenData);
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error("Lỗi create token:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
