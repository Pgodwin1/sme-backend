import path from "path";
import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env";

const servers: swaggerJsdoc.Server[] = [
  { url: `http://localhost:${env.port}`, description: "Local server" },
];

if (process.env.VERCEL_URL) {
  servers.unshift({
    url: `https://${process.env.VERCEL_URL}`,
    description: "Deployed server",
  });
}

const options: swaggerJsdoc.OAS3Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "SME Backend API",
      version: "1.0.0",
      description: "API documentation for the SME backend service.",
    },
    servers,
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
        UserWithModules: {
          allOf: [
            { $ref: "#/components/schemas/User" },
            {
              type: "object",
              properties: {
                modules: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["hr", "payroll", "crm", "sales", "inventory", "accounting", "procurement", "approvals", "reports"],
                  },
                  example: ["hr", "payroll", "crm"],
                },
              },
            },
          ],
        },
        Module: {
          type: "object",
          properties: {
            key: {
              type: "string",
              enum: ["hr", "payroll", "crm", "sales", "inventory", "accounting", "procurement", "approvals", "reports"],
              example: "hr",
            },
            code: { type: "string", example: "M1" },
            name: { type: "string", example: "HR" },
            description: {
              type: "string",
              example: "Employee records, attendance, leave and reviews in one place.",
            },
            features: {
              type: "array",
              items: { type: "string" },
              example: ["Employee records", "Attendance", "Leave management"],
            },
            defaultOn: { type: "boolean", example: true },
            inMvp: { type: "boolean", example: true },
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
  apis: [
    path.join(__dirname, "../routes/*.ts"),
    path.join(__dirname, "../routes/*.js"),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
