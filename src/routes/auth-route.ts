import { Router } from "express";
import { UserController } from "../controllers/user-controller";
import { requireAuth } from "../midleware/auth-middleware";

const router = Router();

router.post("/register", UserController.createUser);
router.post("/login", UserController.login);
router.post("/forgot-password", UserController.forgotPassword);
router.post("/verify-otp", UserController.verifyPasswordOtp);
router.post("/reset-password", UserController.resetPassword);

router.get("/me", requireAuth, UserController.getMe);
router.patch("/onboarding", requireAuth, UserController.completeOnboarding);

export default router;
