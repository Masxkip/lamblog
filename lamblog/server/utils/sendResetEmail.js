require("dotenv").config();
const nodemailer = require("nodemailer");

const sendResetEmail = async (userEmail, resetToken) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // ✅ Keep false for TLS (2525)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetURL = `http://localhost:5173/reset-password/${resetToken}`; // ✅ Correct frontend link

    const mailOptions = {
      from: `"SLXXK Blog" <no-reply@slxxk.com>`, // ✅ Use a fake but proper email format
      to: "test@mailtrap.io", // ✅ Mailtrap allows any fake recipient email
      subject: "Reset Your Password",
      html: `<p>Click <a href="${resetURL}">here</a> to reset your password.</p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent to Mailtrap.");
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
  }
};

module.exports = sendResetEmail;
