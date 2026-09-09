import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import authRouter from "./routes/auth-route";
import moduleRouter from "./routes/module-route";
import inventoryRouter from "./routes/inventry-route";
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
app.use(inventoryRouter);

app.get("/", (_, res) => {
  res.status(200).json({
    success: true,
    message: "API is running 🚀",
  });
});

// Catches errors passed via next(err) — e.g. multer's fileFilter rejection —
// so they come back as JSON instead of Express's default HTML error page.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.status || 400).json({
    success: false,
    message: err.message || "Something went wrong.",
  });
});

export default app;
