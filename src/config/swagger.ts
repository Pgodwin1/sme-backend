import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "SME Backend API",
      version: "1.0.0",
      description: "API documentation for the SME backend service.",
    },
    servers: [
      {
        url: `http://localhost:${env.port}`,
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "670f1c2e5b3c2a0012a4e5f1" },
            fullName: { type: "string", example: "Jane Doe" },
            email: { type: "string", format: "email", example: "jane@example.com" },
            businessName: { type: "string", example: "Jane's Bakery" },
            industry: { type: "string", example: "Retail" },
            size: { type: "string", example: "1-10" },
            role: { type: "string", enum: ["admin", "user"], example: "user" },
            isOnboarded: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Something went wrong." },
          },
        },
      },
    },
  },
  apis: ["./src/docs/*.ts", "./dist/docs/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
