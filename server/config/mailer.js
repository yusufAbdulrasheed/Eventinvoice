import nodemailer from "nodemailer";

export const isMailerConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;

const getTransporter = () => {
  if (!isMailerConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

// Throws if the mailer isn't configured — callers should check
// isMailerConfigured() first to return a clean 503 instead.
export const sendMail = async ({ to, subject, html, text }) => {
  const t = getTransporter();
  if (!t) throw new Error("Email isn't configured (missing SMTP_HOST/SMTP_USER/SMTP_PASS)");
  return t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });
};
