import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createContainer } from "./container.js";
import { errorHandler } from "./infrastructure/http/middlewares/errorMiddleware.js";

export async function createApp() {
  const app = express();
  const container = await createContainer();
  const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!allowedOrigins.includes("https://sip-barang-fe.vercel.app")) {
    allowedOrigins.push("https://sip-barang-fe.vercel.app");
  }

  const corsOptions = {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin tidak diizinkan oleh kebijakan CORS"));
    },
    credentials: true,
    optionsSuccessStatus: 204,
  };

  // Global Middlewares
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
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
