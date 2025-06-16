const express = require("express");
const cors = require('cors'); 
const session = require("express-session");
const bodyParser = require("body-parser");
// const passport = require("./config/passport"); // Import file auth.js (NÊN IMPORT TRƯỚC passport.initialize())
const passport = require('passport');
require('./passport/googleStrategy');

const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const articleRoutes = require("./routes/articleRoutes");
const commentRoutes = require('./routes/commentRoutes'); // Import comment routes
const categoryRoutes = require('./routes/categoryRoutes'); // Import category routes
const mailRoute = require("./routes/mailRoutes");

const fs = require('fs'); // Thêm dòng này để kiểm tra/tạo thư mục
const app = express();
require("dotenv").config(); // Đảm bảo biến môi trường được load
const DOMAIN_FE =process.env.DOMAIN_FE;

// Cấu hình CORS
const corsOptions = {
    origin: DOMAIN_FE, // Cho phép truy cập từ origin của Nuxt.js frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Cho phép các phương thức HTTP này
    credentials: true, // Cho phép gửi cookie/header authorization nếu có
    optionsSuccessStatus: 204 // Một số trình duyệt cũ (IE11, various SmartTVs) mắc kẹt ở 200
};
app.use(cors(corsOptions)); // Sử dụng middleware cors với cấu hình
// Middleware để parse body của request (đặt trước các route và static file serving)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT CẦN KIỂM TRA ---
// Đảm bảo thư mục 'uploads' tồn tại, nếu không thì tạo nó
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
// Cấu hình để phục vụ các file tĩnh trong thư mục 'uploads'
// Khi có yêu cầu đến '/uploads', Express sẽ tìm file trong thư mục 'uploads' trên server
app.use('/uploads', express.static('uploads'));
// --------------------------------------------------

app.use(bodyParser.json());
app.use(session({ secret: "mysecret", resave: false, saveUninitialized: true }));

app.use(passport.initialize()); 
app.use(passport.session());

app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/articles", articleRoutes);
app.use("/comments", commentRoutes);
app.use("/categories", categoryRoutes);
app.use("/mail", mailRoute);

// app.listen(3001, () => console.log("Server chạy tại https://api.dailychill.vn"));
app.listen(3001, '0.0.0.0', () => console.log("Server chạy trên http://103.159.51.13"));
