// sendEmail.js
const nodemailer = require('nodemailer');

// 1. HTML TEMPLATE for the email
const getPasswordResetEmail = (resetLink) => {
  return `
    <div style="font-family: Arial, sans-serif;">
      <h2 style="color: #e53935;">Reset Your Password</h2>
      <p>Click the link below:</p>
      <a href="${resetLink}" style="background: #e53935; padding: 10px 20px; color: white; text-decoration: none; border-radius: 4px;">
        Reset Password
      </a>
    </div>
  `;
};

// 2. FUNCTION to send the email
const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // e.g., yourapp@gmail.com
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"MyApp Support" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

// 3. EXPORT both the email sender and the template
module.exports = {
  sendEmail,
  getPasswordResetEmail,
};