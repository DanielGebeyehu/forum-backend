const sgMail = require('@sendgrid/mail');
const dotenv = require("dotenv");
dotenv.config();

// Initialize SendGrid only if API key is valid
if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.log("⚠️ SendGrid API key not configured or invalid - email functionality disabled");
}

const sendEmail = async (to, subject, html) => {
  try {
    // Check if SendGrid is properly configured
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_API_KEY.startsWith('SG.')) {
      console.log("⚠️ Email sending skipped - SendGrid not configured");
      return { messageId: 'skipped' };
    }

    const msg = {
      to: to,
      from: process.env.EMAIL_USER || 'noreply@evangadiforum.com',
      subject: subject,
      html: html,
    };

    const info = await sgMail.send(msg);
    console.log("✅ Email sent successfully via SendGrid");
    return info;
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    console.error("Full error:", err);
    throw err;
  }
};

module.exports = sendEmail;
