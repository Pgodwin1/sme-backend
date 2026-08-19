"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const user_interface_1 = require("../interface/user-interface");
const userSchema = new mongoose_1.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    businessName: {
        type: String,
        required: false,
        trim: true,
    },
    industry: {
        type: String,
        required: false,
        trim: true,
    },
    size: {
        type: String,
        required: false,
        trim: true,
    },
    role: {
        type: String,
        required: false,
        enum: Object.values(user_interface_1.UserRole),
    },
    token: {
        type: String,
        required: false,
        default: "",
    },
    otp: {
        type: String,
        required: false,
        default: "",
    },
}, {
    timestamps: true,
});
exports.User = (0, mongoose_1.model)("User", userSchema);
