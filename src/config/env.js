export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "development-secret",
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map((origin) => origin.trim()).filter(Boolean),
};

export function addDefaultCorsOrigins(origins = []) {
  const extras = ["https://sip-barang-fe.vercel.app"];
  return [...new Set([...origins, ...extras])];
}
