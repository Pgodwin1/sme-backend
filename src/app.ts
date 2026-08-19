import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRouter from "./routes/auth-route";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(authRouter);

app.get("/", (_, res) => {
  res.status(200).json({
    success: true,
    message: "API is running 🚀",
  });
});

export default app;
