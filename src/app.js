import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createContainer } from "./container.js";
import { errorHandler } from "./infrastructure/http/middlewares/errorMiddleware.js";

export async function createApp() {
  const app = express();
  const container = await createContainer();

  // Global Middlewares
  app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));

  // API Mount
  app.use("/api", container.apiRouter);

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Rute ${req.method} ${req.originalUrl} tidak ditemukan`,
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return { app, container };
}
