import { Router } from "express";

const router = Router();

router.get("/", (_, res) => {
  res.json({
    success: true,
    message: "Express + TypeScript is running 🚀",
  });
});

export default router;
