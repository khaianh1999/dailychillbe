const nodemailer = require("nodemailer");

exports.sendMail = async (req, res) => {
  const { name, email, content } = req.body;

  if (!name || !email || !content) {
    return res.status(400).json({ message: "Thiếu thông tin!" });
  }

  try {
    // Cấu hình transporter (SMTP)
    const transporter = nodemailer.createTransport({
      service: "gmail", // hoặc "hotmail", "outlook", hoặc cấu hình SMTP riêng
      auth: {
        user: process.env.MAIL_USER, // Tài khoản gửi mail
        pass: process.env.MAIL_PASS  // Mật khẩu ứng dụng hoặc token
      }
    });

    // HTML template đẹp (có thể tùy chỉnh)
    const htmlContent = `
      <div style="font-family:sans-serif; padding:20px; background:#f9f9f9; border-radius:10px; max-width:600px; margin:auto;">
        <h2 style="color:#4f46e5;">📨 Yêu cầu từ khách hàng</h2>
        <p><strong>👤 Tên:</strong> ${name}</p>
        <p><strong>📧 Email:</strong> ${email}</p>
        <p><strong>📝 Nội dung:</strong></p>
        <div style="padding:10px; background:white; border-radius:6px; border:1px solid #ddd;">
          ${content}
        </div>
        <p style="margin-top:20px; color:gray; font-size:12px;">Gửi từ hệ thống vào: ${new Date().toLocaleString()}</p>
      </div>
    `;

    // Gửi email
    await transporter.sendMail({
      from: `"${name}" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_RECEIVER, // Email nhận
      subject: "📬 Yêu cầu hỗ trợ từ người dùng",
      html: htmlContent
    });

    res.json({ message: "Gửi mail thành công!" });
  } catch (err) {
    console.error("Lỗi gửi mail:", err);
    res.status(500).json({ message: "Lỗi hệ thống khi gửi mail" });
  }
};

exports.sendOrderSuccessEmail = async (title, description, content) => {  
    if (!title || !description || !content) {
      return res.status(400).json({ message: "Thiếu thông tin!" });
    }
  
    try {
      // Cấu hình transporter (SMTP)
      const transporter = nodemailer.createTransport({
        service: "gmail", // hoặc "hotmail", "outlook", hoặc cấu hình SMTP riêng
        auth: {
          user: process.env.MAIL_USER, // Tài khoản gửi mail
          pass: process.env.MAIL_PASS  // Mật khẩu ứng dụng hoặc token
        }
      });
  
      // HTML template đẹp (có thể tùy chỉnh)
      const htmlContent = `
        <div style="font-family:sans-serif; padding:20px; background:#f9f9f9; border-radius:10px; max-width:600px; margin:auto;">
          <h2 style="color:#4f46e5;">📨  ${title}</h2>
          <p><strong>📝 Mô tả:</strong> ${description}</p>
          <p><strong>📝 Nội dung:</strong></p>
          <div style="padding:10px; background:white; border-radius:6px; border:1px solid #ddd;">
            ${content}
          </div>
          <p style="margin-top:20px; color:gray; font-size:12px;">Gửi từ hệ thống vào: ${new Date().toLocaleString()}</p>
        </div>
      `;
  
      // Gửi email
      await transporter.sendMail({
        from: `"DailyChill" <${process.env.MAIL_USER}>`,
        to: process.env.MAIL_RECEIVER, // Email nhận
        subject: "📬 Yêu cầu hỗ trợ từ người dùng",
        html: htmlContent
      });
    } catch (err) {
      console.error("Lỗi gửi mail:", err);
    }
};    

