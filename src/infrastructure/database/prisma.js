import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

// ESM static hoisting: dotenv HARUS di-load via require sebelum PrismaClient agar
// DATABASE_URL sudah tersedia saat Prisma engine validasi schema.
const require = createRequire(import.meta.url);
const dotenv = require("dotenv");

// Resolve path .env secara eksplisit dari root project (4 level ke atas dari file ini)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../../../.env");
dotenv.config({ path: envPath });

// Pastikan DATABASE_URL tersedia (fallback dari variabel individu)
if (!process.env.DATABASE_URL) {
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "3307";
  const user = process.env.DB_USER || "root";
  const pass = process.env.DB_PASSWORD || "";
  const name = process.env.DB_NAME || "delivery_order_db";
  const auth = pass ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}` : encodeURIComponent(user);
  process.env.DATABASE_URL = `mysql://${auth}@${host}:${port}/${name}`;
}

const { PrismaClient } = require("@prisma/client");

const prisma = globalThis.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
