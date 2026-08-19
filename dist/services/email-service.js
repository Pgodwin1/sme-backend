"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
class EmailService {
    transporter = nodemailer_1.default.createTransport({
        host: env_1.env.smtp.host,
        port: env_1.env.smtp.port,
        secure: env_1.env.smtp.secure,
        auth: {
            user: env_1.env.smtp.user,
            pass: env_1.env.smtp.pass,
        },
    });
    async sendMail({ to, subject, html, text, }) {
        try {
            const info = await this.transporter.sendMail({
                from: env_1.env.smtp.from,
                to,
                subject,
                html,
                text,
            });
            console.log(`📧 Email sent: ${info.messageId}`);
            return info;
        }
        catch (error) {
            console.error("Email Error:", error);
            throw new Error("Failed to send email.");
        }
    }
    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log("✅ SMTP connection established");
        }
        catch (error) {
            console.error("❌ SMTP connection failed");
            console.error(error);
        }
    }
    async sendWelcomeEmail(to, fullName) {
        const subject = "Welcome to Our Platform!";
        const html = `
	  <h1>Welcome, ${fullName}!</h1>
	  <p>Thank you for registering with us. We're excited to have you on board!</p>
	`;
        await this.sendMail({ to, subject, html });
    }
}
exports.default = new EmailService();
