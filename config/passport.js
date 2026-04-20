const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
require("dotenv").config(); // Đảm bảo biến môi trường được load
const User = require("../models/userModel.js");


passport.use(
    new FacebookStrategy(
        {
            clientID: process.env.FB_CLIENT_ID,
            clientSecret: process.env.FB_CLIENT_SECRET,
            callbackURL: "https://api.dailychill.vn/auth/facebook/callback",
            profileFields: ["id", "displayName", "name", "emails"], // Lấy thêm thông tin nếu cần
        },
        async function (accessToken, refreshToken, profile, done) {
            try {
                // Kiểm tra xem user đã tồn tại chưa
                // let user = await User.findOne({ where: { id_fb: profile.id } });
                let user = await User.findOne({ id_fb: profile.id }); // Gọi phương thức mới sửa

                if (!user) {
                    // Nếu chưa có, tạo user mới
                    user = await User.createUserByFacebook({
                        id_fb: profile.id,
                        full_name: profile.displayName, // Lấy displayName từ Facebook
                        avatar: "uploads/avatar.jpg",
                        coin: 0,
                        code: generateRandomUppercaseCode(8),
                    });
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    // Khi user đăng nhập, lưu ID của họ vào session
    done(null, user.id_fb);
});
passport.deserializeUser(async (id_fb, done) => {
    try {
        if (!id_fb) {
            throw new Error("Invalid id_fb in deserializeUser");
        }

        console.log("Deserializing user with id_fb:", id_fb); // Log kiểm tra

        const user = await User.findOne({ id_fb }); // Gọi phương thức mới sửa
        done(null, user);
    } catch (error) {
        console.error("Error in deserializeUser:", error.message);
        done(error, null);
    }
});

function generateRandomUppercaseCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // Chỉ chứa chữ cái in hoa và số
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// ⚠️ Đảm bảo chỉ export `passport` SAU khi đã cấu hình xong
module.exports = passport;
