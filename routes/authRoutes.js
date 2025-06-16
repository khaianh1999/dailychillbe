const express = require("express");
// const passport = require("../auth");
const passport = require("../config/passport");
const jwt = require("jsonwebtoken");
require("dotenv").config(); // Đảm bảo biến môi trường được load
const DOMAIN_FE =process.env.DOMAIN_FE;
const router = express.Router();
/* cũ, tạm cmt
router.get("/facebook", passport.authenticate("facebook"));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    successRedirect: "/auth/profile",
    // successRedirect: "http://localhost:3000/profile",   // ✅ Redirect về frontend sau khi login thành công
    failureRedirect: "/",
  })
);
*/
// {
//   id: 6,
//   full_name: "Khải Ngô",
//   email: null,
//   id_fb: "1320776219123113",
//   deleted: false
// }

// Bước 1: Khởi tạo login
router.get("/facebook", passport.authenticate("facebook"));

// Bước 2: Callback từ Facebook
router.get("/facebook/callback",
  passport.authenticate("facebook", { session: false, failureRedirect: "/" }),
  function (req, res) {
    // Sinh JWT khi login thành công
    const payload = {
      id: req.user.id,
      full_name: req.user.full_name,
      email: req.user.email || null,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "30d"
    });

    // ✅ Redirect về frontend kèm token (cách 1: query param)
    res.redirect(`${DOMAIN_FE}/profile?token=${token}`);
  }
);

// router.get("/profile", (req, res) => {
//   if (!req.isAuthenticated()) return res.redirect("/");
//   res.json(req.user);
// });

router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

// Đăng nhập bằng gg
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const user = req.user;

    const payload = {
      id: user.id,
      email: user.email,
      full_name: user.full_name
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    // ✅ Redirect về frontend kèm token
    res.redirect(`${DOMAIN_FE}/profile?token=${token}`);
  }
);

module.exports = router;
