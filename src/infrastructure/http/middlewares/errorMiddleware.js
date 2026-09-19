export function errorHandler(err, req, res, next) {
  console.error(`[API ERROR] ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Terjadi kesalahan internal pada server";

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}
