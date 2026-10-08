import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createContainer } from "./container.js";
import { errorHandler } from "./infrastructure/http/middlewares/errorMiddleware.js";
import { addDefaultCorsOrigins, env } from "./config/env.js";

function buildCorsOptions() {
  const allowedOrigins = addDefaultCorsOrigins(env.corsOrigins);

  return {
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
}

export async function createApp() {
  const app = express();
  const container = await createContainer();
  const corsOptions = buildCorsOptions();

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

  app.use("/api", container.apiRouter);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Rute ${req.method} ${req.originalUrl} tidak ditemukan`,
    });
  });

  app.use(errorHandler);

  return { app, container };
}
