import { IUser, IUserDoc } from "../interface/user-interface";
import { User } from "../models/user-model";

class UserService {
  async getUserByEmail(email: string): Promise<IUserDoc | null> {
    return await User.findOne({ email });
  }

  async createUser(userData: IUser): Promise<IUserDoc> {
    const user = new User(userData);
    return await user.save();
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }
    return user.otp === otp;
  }

  async updateUserOtpOrToken(email: string, otp: string, token?: string): Promise<IUserDoc | null> {
    return await User.findOneAndUpdate({ email }, { otp, token }, { new: true });
  }
}

export default new UserService();
