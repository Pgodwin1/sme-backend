import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import authRouter from "./routes/auth-route";
import moduleRouter from "./routes/module-route";
import { swaggerSpec } from "./config/swagger";

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
app.use(authRouter);
app.use(moduleRouter);

app.get("/", (_, res) => {
  res.status(200).json({
    success: true,
    message: "API is running 🚀",
  });
});

export default app;
