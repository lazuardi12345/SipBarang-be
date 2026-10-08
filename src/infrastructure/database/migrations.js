/**
 * migrations.js
 * DDL SQL untuk membuat semua tabel delivery order app di MySQL.
 * Dijalankan via: node src/infrastructure/database/migrate.js
 *
 * Catatan:
 * Struktur ini mengikuti model Prisma yang sudah di-normalisasi agar
 * satu order tidak menumpuk semua data di satu tabel besar.
 */

export const CREATE_DATABASE_SQL = `
  CREATE DATABASE IF NOT EXISTS \`delivery_order_db\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
`;

export const USE_DATABASE_SQL = `USE \`delivery_order_db\`;`;

export const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS \`users\` (
    \`id\`            VARCHAR(64)  NOT NULL PRIMARY KEY,
    \`nama\`          VARCHAR(150) NOT NULL,
    \`email\`         VARCHAR(150) NOT NULL UNIQUE,
    \`password_hash\` VARCHAR(255) NOT NULL,
    \`role\`          ENUM('ADMIN','DIREKTUR','SUPERADMIN') NOT NULL DEFAULT 'ADMIN',
    \`created_at\`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export const CREATE_TARIFS_TABLE = `
  CREATE TABLE IF NOT EXISTS \`tarifs\` (
    \`id\`                VARCHAR(64)   NOT NULL PRIMARY KEY,
    \`area_distribusi\`   VARCHAR(200)  NOT NULL,
    \`tujuan_kirim\`      VARCHAR(200)  NOT NULL,
    \`total\`             DECIMAL(15,2) NOT NULL DEFAULT 0,
    \`total_setelah_pph\` DECIMAL(15,2) NOT NULL DEFAULT 0,
    \`created_at\`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_area (\`area_distribusi\`),
    INDEX idx_tujuan (\`tujuan_kirim\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export const CREATE_DELIVERY_ORDERS_TABLE = `
  CREATE TABLE IF NOT EXISTS \`delivery_orders\` (
    \`id\`                VARCHAR(64)   NOT NULL PRIMARY KEY,
    \`no_do\`             VARCHAR(100)  NOT NULL,
    \`tanggal_kirim\`     DATETIME      NULL,
    \`status\`            ENUM('DRAFT','PLANNING','MENUNGGU_ACC','MENUNGGU_APPROVAL','DISETUJUI','APPROVED','DITOLAK','REJECTED','DALAM_PENGIRIMAN','MENUNGGU_KONFIRMASI','TERKIRIM','DIKIRIM','SELESAI','DIBATALKAN') NOT NULL DEFAULT 'DRAFT',
    \`tarif_id\`          VARCHAR(64)   NULL,
    \`area_distribusi\`   VARCHAR(200)  NULL,
    \`tujuan_kirim\`      VARCHAR(200)  NULL,
    \`biaya_ekspedisi\`   DECIMAL(15,2) NOT NULL DEFAULT 0,
    \`items_barang\`      JSON          NULL,
    \`nama_barang\`       TEXT          NULL,
    \`jumlah_koli\`       INT           NOT NULL DEFAULT 0,
    \`total_nilai_barang\` DECIMAL(15,2) NOT NULL DEFAULT 0,
    \`berat_barang_kg\`   DECIMAL(10,2) NOT NULL DEFAULT 0,
    \`catatan_barang\`    TEXT          NULL,
    \`dibuat_oleh\`       JSON          NULL,
    \`created_at\`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_status (\`status\`),
    INDEX idx_no_do (\`no_do\`),
    INDEX idx_tarif_id (\`tarif_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export const CREATE_DELIVERY_ORDER_SCHEDULES_TABLE = `
  CREATE TABLE IF NOT EXISTS \`delivery_order_schedules\` (
    \`id\`                 VARCHAR(64)   NOT NULL PRIMARY KEY,
    \`order_id\`           VARCHAR(64)   NOT NULL UNIQUE,
    \`no_schedule\`        VARCHAR(100)  NULL,
    \`tgl_schedule\`       DATE          NULL,
    \`tipe_mobil_rit\`     VARCHAR(100)  NULL,
    \`gudang_asal\`       VARCHAR(200)  NULL,
    \`nama_supir\`         VARCHAR(150)  NULL,
    \`no_hp_supir\`        VARCHAR(30)   NULL,
    \`no_polisi_kendaraan\` VARCHAR(30)  NULL,
    \`jenis_kendaraan\`    VARCHAR(100)  NULL,
    \`created_at\`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_dos_order FOREIGN KEY (\`order_id\`) REFERENCES \`delivery_orders\`(\`id\`) ON DELETE CASCADE,
    INDEX idx_order_id (\`order_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export const CREATE_DELIVERY_ORDER_DOCUMENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS \`delivery_order_documents\` (
    \`id\`                   VARCHAR(64)   NOT NULL PRIMARY KEY,
    \`order_id\`             VARCHAR(64)   NOT NULL UNIQUE,
    \`no_doc_perusahaan\`    VARCHAR(100)  NULL,
    \`tgl_doc_perusahaan\`   DATE          NULL,
    \`nama_toko\`            VARCHAR(200)  NULL,
    \`salesman\`             VARCHAR(150)  NULL,
    \`agen\`                 VARCHAR(100)  NULL DEFAULT 'TBN',
    \`kota\`                 VARCHAR(100)  NULL,
    \`kecamatan\`            VARCHAR(100)  NULL,
    \`alamat_lengkap_tujuan\` TEXT         NULL,
    \`no_hp_penerima\`       VARCHAR(30)   NULL,
    \`keterangan_doc\`       TEXT          NULL,
    \`created_at\`           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\`           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_dod_order FOREIGN KEY (\`order_id\`) REFERENCES \`delivery_orders\`(\`id\`) ON DELETE CASCADE,
    INDEX idx_order_id (\`order_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export const CREATE_DELIVERY_ORDER_APPROVALS_TABLE = `
  CREATE TABLE IF NOT EXISTS \`delivery_order_approvals\` (
    \`id\`         VARCHAR(64)   NOT NULL PRIMARY KEY,
    \`order_id\`   VARCHAR(64)   NOT NULL,
    \`user_id\`    VARCHAR(64)   NOT NULL,
    \`action\`     VARCHAR(30)   NOT NULL,
    \`note\`       TEXT          NULL,
    \`created_at\` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_doa_order FOREIGN KEY (\`order_id\`) REFERENCES \`delivery_orders\`(\`id\`) ON DELETE CASCADE,
    INDEX idx_order_id (\`order_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export const CREATE_DELIVERY_ORDER_REPORTS_TABLE = `
  CREATE TABLE IF NOT EXISTS \`delivery_order_reports\` (
    \`id\`                 VARCHAR(64)   NOT NULL PRIMARY KEY,
    \`order_id\`           VARCHAR(64)   NOT NULL,
    \`nama_penerima_barang\` VARCHAR(200) NULL,
    \`catatan_pelaporan\`   TEXT          NULL,
    \`bukti_pengiriman_url\` TEXT         NULL,
    \`tanggal_diterima\`    DATETIME      NULL,
    \`created_at\`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_dor_order FOREIGN KEY (\`order_id\`) REFERENCES \`delivery_orders\`(\`id\`) ON DELETE CASCADE,
    INDEX idx_order_id (\`order_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export const CREATE_DELIVERY_ORDER_CONFIRMATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS \`delivery_order_confirmations\` (
    \`id\`                       VARCHAR(64)   NOT NULL PRIMARY KEY,
    \`order_id\`                 VARCHAR(64)   NOT NULL,
    \`user_id\`                  VARCHAR(64)   NOT NULL,
    \`catatan_konfirmasi_direktur\` TEXT       NULL,
    \`confirmed_at\`            DATETIME      NULL,
    \`created_at\`               DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_doc_order FOREIGN KEY (\`order_id\`) REFERENCES \`delivery_orders\`(\`id\`) ON DELETE CASCADE,
    INDEX idx_order_id (\`order_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export const CREATE_DELIVERY_ORDER_HISTORIES_TABLE = `
  CREATE TABLE IF NOT EXISTS \`delivery_order_histories\` (
    \`id\`         VARCHAR(64)   NOT NULL PRIMARY KEY,
    \`order_id\`   VARCHAR(64)   NOT NULL,
    \`old_status\` VARCHAR(50)   NULL,
    \`new_status\` VARCHAR(50)   NOT NULL,
    \`changed_by\` VARCHAR(64)   NULL,
    \`note\`       TEXT          NULL,
    \`created_at\` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_doh_order FOREIGN KEY (\`order_id\`) REFERENCES \`delivery_orders\`(\`id\`) ON DELETE CASCADE,
    INDEX idx_order_id (\`order_id\`),
    INDEX idx_new_status (\`new_status\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export const CREATE_INVOICES_TABLE = `
  CREATE TABLE IF NOT EXISTS \`invoices\` (
    \`id\`             VARCHAR(64)   NOT NULL PRIMARY KEY,
    \`order_id\`       VARCHAR(64)   NULL UNIQUE,
    \`no_invoice\`     VARCHAR(100)  NOT NULL UNIQUE,
    \`tanggal_invoice\` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`nama_pelanggan\` VARCHAR(200)  NOT NULL,
    \`alamat_pelanggan\` TEXT        NULL,
    \`no_po_customer\` VARCHAR(100)  NULL,
    \`subtotal\`       DECIMAL(15,2) NOT NULL DEFAULT 0,
    \`total_pph2\`     DECIMAL(15,2) NOT NULL DEFAULT 0,
    \`total_tagihan\`  DECIMAL(15,2) NOT NULL DEFAULT 0,
    \`status\`         ENUM('BELUM_LUNAS','LUNAS','DIBATALKAN') NOT NULL DEFAULT 'BELUM_LUNAS',
    \`dibuat_oleh\`    JSON          NULL,
    \`created_at\`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_invoice_order FOREIGN KEY (\`order_id\`) REFERENCES \`delivery_orders\`(\`id\`) ON DELETE SET NULL,
    INDEX idx_status (\`status\`),
    INDEX idx_no_invoice (\`no_invoice\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export const CREATE_INVOICE_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS \`invoice_items\` (
    \`id\`               VARCHAR(64)   NOT NULL PRIMARY KEY,
    \`invoice_id\`       VARCHAR(64)   NOT NULL,
    \`delivery_order_id\` VARCHAR(64)  NULL,
    \`no_do\`            VARCHAR(100)  NULL,
    \`no_doc_perusahaan\` VARCHAR(100) NULL,
    \`tgl_doc_perusahaan\` DATE       NULL,
    \`nama_toko\`        VARCHAR(200)  NULL,
    \`area_distribusi\`  VARCHAR(200)  NULL,
    \`tujuan_kirim\`     VARCHAR(200)  NULL,
    \`tanggal_kirim\`    DATETIME      NULL,
    \`nama_supir\`       VARCHAR(150)  NULL,
    \`no_polisi_kendaraan\` VARCHAR(80) NULL,
    \`nama_barang\`      TEXT          NULL,
    \`jumlah_koli\`      INT           NOT NULL DEFAULT 0,
    \`biaya_ekspedisi\`  DECIMAL(15,2) NOT NULL DEFAULT 0,
    \`pph2\`             DECIMAL(15,2) NOT NULL DEFAULT 0,
    \`total_setelah_pph\` DECIMAL(15,2) NOT NULL DEFAULT 0,
    \`created_at\`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invoice_item_invoice FOREIGN KEY (\`invoice_id\`) REFERENCES \`invoices\`(\`id\`) ON DELETE CASCADE,
    INDEX idx_invoice_id (\`invoice_id\`),
    INDEX idx_delivery_order_id (\`delivery_order_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export const ALL_MIGRATIONS = [
  { name: "users", sql: CREATE_USERS_TABLE },
  { name: "tarifs", sql: CREATE_TARIFS_TABLE },
  { name: "delivery_orders", sql: CREATE_DELIVERY_ORDERS_TABLE },
  { name: "delivery_order_schedules", sql: CREATE_DELIVERY_ORDER_SCHEDULES_TABLE },
  { name: "delivery_order_documents", sql: CREATE_DELIVERY_ORDER_DOCUMENTS_TABLE },
  { name: "delivery_order_approvals", sql: CREATE_DELIVERY_ORDER_APPROVALS_TABLE },
  { name: "delivery_order_reports", sql: CREATE_DELIVERY_ORDER_REPORTS_TABLE },
  { name: "delivery_order_confirmations", sql: CREATE_DELIVERY_ORDER_CONFIRMATIONS_TABLE },
  { name: "delivery_order_histories", sql: CREATE_DELIVERY_ORDER_HISTORIES_TABLE },
  { name: "invoices", sql: CREATE_INVOICES_TABLE },
  { name: "invoice_items", sql: CREATE_INVOICE_ITEMS_TABLE },
];
