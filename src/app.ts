import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import authRouter from "./routes/auth-route";
import moduleRouter from "./routes/module-route";
import { swaggerSpec } from "./config/swagger";
import { connectDatabase } from "./config/database";

const app = express();

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCssUrl: "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.32.14/swagger-ui.css",
    customJs: [
      "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.32.14/swagger-ui-bundle.js",
      "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.32.14/swagger-ui-standalone-preset.js",
    ],
  })
);

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes below need the DB — connect (or reuse the cached connection) before
// they run. This is what actually establishes the connection on Vercel,
// since server.ts's app.listen() bootstrap never runs there.
app.use(async (_req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    res.status(503).json({ success: false, message: "Database connection failed." });
  }
});

app.use(authRouter);
app.use(moduleRouter);

app.get("/", (_, res) => {
  res.status(200).json({
    success: true,
    message: "API is running 🚀",
  });
});

export default app;
