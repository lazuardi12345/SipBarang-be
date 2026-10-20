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

  try {
    const [driverExpenseColumn] = await conn.query(
      "SHOW COLUMNS FROM `delivery_orders` LIKE 'uang_jalan_supir'"
    );
    if (driverExpenseColumn.length === 0) {
      await conn.query(
        "ALTER TABLE `delivery_orders` ADD COLUMN `uang_jalan_supir` DECIMAL(15,2) NULL AFTER `biaya_ekspedisi`"
      );
      console.log("✅ Kolom 'uang_jalan_supir' berhasil ditambahkan ke tabel delivery_orders.");
    }
  } catch (err) {
    console.error("❌ Sinkronisasi uang jalan sopir gagal:", err.message);
    await conn.end();
    throw err;
  }

  try {
    const [tarifDriverExpenseColumn] = await conn.query(
      "SHOW COLUMNS FROM `tarifs` LIKE 'total_setelah_pph'"
    );
    if (tarifDriverExpenseColumn.length > 0) {
      await conn.query(
        `UPDATE \`delivery_orders\` AS d
         INNER JOIN \`tarifs\` AS t ON t.\`id\` = d.\`tarif_id\`
         SET d.\`uang_jalan_supir\` = t.\`total_setelah_pph\`
         WHERE d.\`uang_jalan_supir\` IS NULL`
      );
      await conn.query(
        `UPDATE \`delivery_orders\` AS d
         INNER JOIN \`tarifs\` AS t
           ON UPPER(TRIM(t.\`area_distribusi\`)) = UPPER(TRIM(d.\`area_distribusi\`))
          AND UPPER(TRIM(t.\`tujuan_kirim\`)) = UPPER(TRIM(d.\`tujuan_kirim\`))
         SET d.\`uang_jalan_supir\` = t.\`total_setelah_pph\`
         WHERE d.\`uang_jalan_supir\` IS NULL`
      );
      console.log("✅ Uang jalan DO lama disalin dari master tarif.");
      await conn.query("ALTER TABLE `tarifs` DROP COLUMN `total_setelah_pph`");
      console.log("✅ Kolom uang jalan lama di master tarif berhasil dihapus.");
    }
  } catch (err) {
    console.error("❌ Penghapusan kolom uang jalan master tarif gagal:", err.message);
    await conn.end();
    throw err;
  }

  try {
    const [lembarColumn] = await conn.query(
      "SHOW COLUMNS FROM `delivery_order_documents` LIKE 'lembar'"
    );
    if (lembarColumn.length === 0) {
      await conn.query(
        "ALTER TABLE `delivery_order_documents` ADD COLUMN `lembar` VARCHAR(100) NULL AFTER `keterangan_doc`"
      );
      console.log("✅ Kolom 'lembar' berhasil ditambahkan ke tabel delivery_order_documents.");
    } else {
      console.log("✅ Kolom 'lembar' sudah tersedia di tabel delivery_order_documents.");
    }
  } catch (err) {
    console.error("❌ Sinkronisasi kolom lembar gagal:", err.message);
    await conn.end();
    throw err;
  }

  try {
    const [mdoColumn] = await conn.query(
      "SHOW COLUMNS FROM `delivery_order_documents` LIKE 'mdo'"
    );
    if (mdoColumn.length === 0) {
      await conn.query(
        "ALTER TABLE `delivery_order_documents` ADD COLUMN `mdo` VARCHAR(100) NULL AFTER `keterangan_doc`"
      );
      console.log("✅ Kolom 'mdo' berhasil ditambahkan ke tabel delivery_order_documents.");
    } else {
      console.log("✅ Kolom 'mdo' sudah tersedia di tabel delivery_order_documents.");
    }
  } catch (err) {
    console.error("❌ Sinkronisasi kolom MDO gagal:", err.message);
    await conn.end();
    throw err;
  }

  try {
    await conn.query(
      "ALTER TABLE `delivery_order_reports` MODIFY COLUMN `bukti_pengiriman_url` LONGTEXT NULL"
    );
    console.log("✅ Kolom bukti foto pengiriman mendukung file foto berukuran besar.");
  } catch (err) {
    console.error("❌ Sinkronisasi kolom bukti foto gagal:", err.message);
    await conn.end();
    throw err;
  }

  try {
    const [tokenColumn] = await conn.query(
      "SHOW COLUMNS FROM `invoices` LIKE 'verification_token'"
    );
    if (tokenColumn.length === 0) {
      await conn.query(
        "ALTER TABLE `invoices` ADD COLUMN `verification_token` VARCHAR(64) NULL AFTER `dibuat_oleh`"
      );
      console.log("✅ Kolom 'verification_token' berhasil ditambahkan ke tabel invoices.");
    }

    await conn.query(
      "UPDATE `invoices` SET `verification_token` = LOWER(REPLACE(UUID(), '-', '')) WHERE `verification_token` IS NULL OR `verification_token` = ''"
    );

    const [tokenIndex] = await conn.query(
      "SHOW INDEX FROM `invoices` WHERE `Key_name` = 'uq_invoices_verification_token'"
    );
    if (tokenIndex.length === 0) {
      await conn.query(
        "ALTER TABLE `invoices` ADD UNIQUE INDEX `uq_invoices_verification_token` (`verification_token`)"
      );
    }
    console.log("✅ Token verifikasi invoice siap.");
  } catch (err) {
    console.error("❌ Sinkronisasi token verifikasi invoice gagal:", err.message);
    await conn.end();
    throw err;
  }

  await conn.end();
  console.log("\n🎉 Migrasi selesai! Database siap digunakan.\n");
}

migrate().catch((err) => {
  console.error("\n💥 Migrasi gagal:", err.message);
  process.exit(1);
});
