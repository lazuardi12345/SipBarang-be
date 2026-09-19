/**
 * MysqlInvoiceRepository — Implementasi IInvoiceRepository menggunakan MySQL.
 */
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository.js";
import { Invoice } from "../../domain/entities/Invoice.js";

export class MysqlInvoiceRepository extends IInvoiceRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  _toEntity(row) {
    if (!row) return null;
    return new Invoice({
      id: row.id,
      noInvoice: row.no_invoice,
      tanggalInvoice: row.tanggal_invoice?.toISOString?.() || row.tanggal_invoice,
      namaPelanggan: row.nama_pelanggan,
      alamatPelanggan: row.alamat_pelanggan,
      noPoCustomer: row.no_po_customer,
      items: typeof row.items === "string" ? JSON.parse(row.items || "[]") : (row.items || []),
      subtotal: Number(row.subtotal || 0),
      totalPPh2: Number(row.total_pph2 || 0),
      totalTagihan: Number(row.total_tagihan || 0),
      status: row.status,
      dibuatOleh: typeof row.dibuat_oleh === "string" ? JSON.parse(row.dibuat_oleh || "null") : row.dibuat_oleh,
      createdAt: row.created_at?.toISOString?.() || row.created_at,
      updatedAt: row.updated_at?.toISOString?.() || row.updated_at,
    });
  }

  async create(invoice) {
    await this.pool.query(
      `INSERT INTO invoices 
        (id, no_invoice, tanggal_invoice, nama_pelanggan, alamat_pelanggan, no_po_customer, items, subtotal, total_pph2, total_tagihan, status, dibuat_oleh)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoice.id,
        invoice.noInvoice,
        invoice.tanggalInvoice || new Date(),
        invoice.namaPelanggan,
        invoice.alamatPelanggan || "",
        invoice.noPoCustomer || null,
        JSON.stringify(invoice.items || []),
        Number(invoice.subtotal || 0),
        Number(invoice.totalPPh2 || invoice.totalPPh || 0),
        Number(invoice.totalTagihan || invoice.totalBersih || 0),
        invoice.status || "BELUM_LUNAS",
        invoice.dibuatOleh ? JSON.stringify(invoice.dibuatOleh) : null,
      ]
    );
    return new Invoice(invoice);
  }

  async update(invoice) {
    const [existing] = await this.pool.query(
      "SELECT * FROM invoices WHERE id = ? LIMIT 1",
      [invoice.id]
    );
    if (existing.length === 0) {
      throw new Error("Invoice tidak ditemukan");
    }

    await this.pool.query(
      `UPDATE invoices SET 
        nama_pelanggan = ?, alamat_pelanggan = ?, no_po_customer = ?,
        items = ?, subtotal = ?, total_pph2 = ?, total_tagihan = ?,
        status = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        invoice.namaPelanggan ?? existing[0].nama_pelanggan,
        invoice.alamatPelanggan ?? existing[0].alamat_pelanggan,
        invoice.noPoCustomer ?? existing[0].no_po_customer,
        JSON.stringify(invoice.items || existing[0].items),
        Number(invoice.subtotal ?? existing[0].subtotal),
        Number(invoice.totalPPh2 ?? invoice.totalPPh ?? existing[0].total_pph2),
        Number(invoice.totalTagihan ?? invoice.totalBersih ?? existing[0].total_tagihan),
        invoice.status ?? existing[0].status,
        invoice.id,
      ]
    );

    const [updated] = await this.pool.query("SELECT * FROM invoices WHERE id = ? LIMIT 1", [invoice.id]);
    return this._toEntity(updated[0]);
  }

  async findById(id) {
    const [rows] = await this.pool.query("SELECT * FROM invoices WHERE id = ? LIMIT 1", [id]);
    return this._toEntity(rows[0]);
  }

  async list() {
    const [rows] = await this.pool.query("SELECT * FROM invoices ORDER BY created_at DESC");
    return rows.map((r) => this._toEntity(r));
  }

  async count() {
    const [rows] = await this.pool.query("SELECT COUNT(*) as cnt FROM invoices");
    return rows[0].cnt;
  }
}
