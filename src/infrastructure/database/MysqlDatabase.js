/**
 * MysqlDatabase.js
 * Singleton MySQL Connection Pool menggunakan mysql2/promise.
 * Port, host, user, password, dan dbname dibaca dari .env
 */
import mysql from "mysql2/promise";
import "dotenv/config";

let _pool = null;

export async function getPool() {
  if (_pool) return _pool;

  _pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "delivery_order_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "+07:00",
    // Return JS objects, bukan Map
    typeCast: function (field, next) {
      if (field.type === "JSON") {
        const val = field.string();
        try {
          return val ? JSON.parse(val) : null;
        } catch {
          return val;
        }
      }
      return next();
    },
  });

  // Test koneksi
  try {
    const conn = await _pool.getConnection();
    console.log(
      `✅ MySQL terhubung: ${process.env.DB_HOST}:${process.env.DB_PORT} / ${process.env.DB_NAME}`
    );
    conn.release();
  } catch (err) {
    console.error("❌ Gagal terhubung ke MySQL:", err.message);
    throw err;
  }

  return _pool;
}
