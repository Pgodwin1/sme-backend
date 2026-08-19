"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../models/user-model");
class UserService {
    async getUserByEmail(email) {
        return await user_model_1.User.findOne({ email });
    }
    async createUser(userData) {
        const user = new user_model_1.User(userData);
        return await user.save();
    }
    async verifyOtp(email, otp) {
        const user = await this.getUserByEmail(email);
        if (!user) {
            throw new Error("User not found");
        }
        return user.otp === otp;
    }
    async updateUserOtpOrToken(email, otp, token) {
        return await user_model_1.User.findOneAndUpdate({ email }, { otp, token }, { new: true });
    }
}
exports.default = new UserService();
