/**
 * migrate.js — Runner migrasi database MySQL.
 * Jalankan: node src/infrastructure/database/migrate.js
 * Membuat database dan semua tabel tanpa memasukkan data contoh.
 */
import mysql from "mysql2/promise";
import "dotenv/config";
import { CREATE_DATABASE_SQL, ALL_MIGRATIONS } from "./migrations.js";

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || 3307);
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "delivery_order_db";

async function migrate() {
  console.log("🚀 Memulai migrasi database MySQL...");
  console.log(`   Host: ${DB_HOST}:${DB_PORT}`);
  console.log(`   Database: ${DB_NAME}\n`);

  // 1. Koneksi tanpa database untuk CREATE DATABASE
  const rootConn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
  });

  await rootConn.query(CREATE_DATABASE_SQL);
  console.log(`✅ Database "${DB_NAME}" siap.\n`);
  await rootConn.end();

  // 2. Koneksi ke database target
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  // 3. Jalankan semua DDL migrations
  for (const m of ALL_MIGRATIONS) {
    try {
      await conn.query(m.sql);
      console.log(`✅ Tabel "${m.name}" — OK`);
    } catch (err) {
      console.error(`❌ Tabel "${m.name}" — GAGAL:`, err.message);
    }
  }

  // 4. Pastikan kolom pph_2 dan total_setelah_pph tersinkronisasi di tabel delivery_orders
  try {
    const [colsPph] = await conn.query("SHOW COLUMNS FROM `delivery_orders` LIKE 'pph_2'");
    if (colsPph.length === 0) {
      await conn.query("ALTER TABLE `delivery_orders` ADD COLUMN `pph_2` DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER `biaya_ekspedisi`");
      console.log("✅ Kolom 'pph_2' berhasil ditambahkan ke tabel delivery_orders.");
    } else {
      console.log("✅ Kolom 'pph_2' sudah tersedia di tabel delivery_orders.");
    }

    const [colsTotal] = await conn.query("SHOW COLUMNS FROM `delivery_orders` LIKE 'total_setelah_pph'");
    if (colsTotal.length === 0) {
      await conn.query("ALTER TABLE `delivery_orders` ADD COLUMN `total_setelah_pph` DECIMAL(15,2) NOT NULL DEFAULT 0");
      console.log("✅ Kolom 'total_setelah_pph' berhasil ditambahkan ke tabel delivery_orders.");
    } else {
      console.log("✅ Kolom 'total_setelah_pph' sudah tersedia di tabel delivery_orders.");
    }
  } catch (err) {
    console.log("ℹ️ Sinkronisasi kolom delivery_orders:", err.message);
  }

  await conn.end();
  console.log("\n🎉 Migrasi selesai! Database siap digunakan.\n");
}

migrate().catch((err) => {
  console.error("\n💥 Migrasi gagal:", err.message);
  process.exit(1);
});
