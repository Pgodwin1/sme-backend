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
    if (!user || !user.otp) {
      return false;
    }
    if (user.otpExpiresAt && user.otpExpiresAt.getTime() < Date.now()) {
      return false;
    }
    return user.otp === otp;
  }

  async setOtp(email: string, otp: string, otpExpiresAt: Date): Promise<IUserDoc | null> {
    return await User.findOneAndUpdate({ email }, { otp, otpExpiresAt }, { new: true });
  }

  async clearOtp(email: string): Promise<IUserDoc | null> {
    return await User.findOneAndUpdate(
      { email },
      { otp: "", otpExpiresAt: null },
      { new: true },
    );
  }

  async updateUserToken(email: string, token: string): Promise<IUserDoc | null> {
    return await User.findOneAndUpdate({ email }, { token }, { new: true });
  }

  async getUserById(id: string): Promise<IUserDoc | null> {
    return await User.findById(id);
  }

  async completeOnboarding(
    id: string,
    data: Partial<Pick<IUser, "businessName" | "industry" | "size" | "role">>,
  ): Promise<IUserDoc | null> {
    return await User.findByIdAndUpdate(
      id,
      { ...data, isOnboarded: true },
      { new: true },
    );
  }
}

export default new UserService();
