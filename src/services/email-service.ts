import nodemailer from "nodemailer";
import { env } from "../config/env";

class EmailService {
  private transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
  });

  async sendMail({
    to,
    subject,
    html,
    text,
  }: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }) {
    try {
      const info = await this.transporter.sendMail({
        from: env.smtp.from,
        to,
        subject,
        html,
        text,
      });

      console.log(`📧 Email sent: ${info.messageId}`);

      return info;
    } catch (error) {
      console.error("Email Error:", error);
      throw new Error("Failed to send email.");
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log("✅ SMTP connection established");
    } catch (error) {
      console.error("❌ SMTP connection failed");
      console.error(error);
    }
  }

  async sendWelcomeEmail(to: string, fullName: string) {
	const subject = "Welcome to Our Platform!";
	const html = `
	  <h1>Welcome, ${fullName}!</h1>
	  <p>Thank you for registering with us. We're excited to have you on board!</p>
	`;
    await this.sendMail({ to, subject, html });
  }
}

export default new EmailService();
