"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const crypto_1 = __importDefault(require("crypto"));
const generateAccessToken = (id, email, role) => {
    return jsonwebtoken_1.default.sign({ id, email, role }, env_1.env.jwtSecret, { expiresIn: "1d" });
};
exports.generateAccessToken = generateAccessToken;
const generateOTP = () => {
    // Generates a number between 100000 and 999999
    const otp = crypto_1.default.randomInt(100000, 1000000);
    return otp.toString();
};
exports.generateOTP = generateOTP;
