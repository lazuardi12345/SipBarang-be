/**
 * MysqlDeliveryOrderRepository — Implementasi IDeliveryOrderRepository menggunakan MySQL.
 * Field yang berupa nested object/array disimpan sebagai JSON column.
 */
import { IDeliveryOrderRepository } from "../../domain/repositories/IDeliveryOrderRepository.js";
import { DeliveryOrder } from "../../domain/entities/DeliveryOrder.js";

export class MysqlDeliveryOrderRepository extends IDeliveryOrderRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  /**
   * Map row MySQL (snake_case) → DeliveryOrder entity (camelCase)
   */
  _toEntity(row) {
    if (!row) return null;
    return new DeliveryOrder({
      id: row.id,
      noDO: row.no_do,
      tanggalKirim: row.tanggal_kirim?.toISOString?.() || row.tanggal_kirim,

      noSchedule: row.no_schedule,
      tglSchedule: row.tgl_schedule,
      tipeMobilRit: row.tipe_mobil_rit,
      gudangAsal: row.gudang_asal,
      namaSupir: row.nama_supir,
      noHpSupir: row.no_hp_supir,
      noPolisiKendaraan: row.no_polisi_kendaraan,
      jenisKendaraan: row.jenis_kendaraan,

      noDocPerusahaan: row.no_doc_perusahaan,
      tglDocPerusahaan: row.tgl_doc_perusahaan,
      namaToko: row.nama_toko,
      salesman: row.salesman,
      agen: row.agen,
      kota: row.kota,
      kecamatan: row.kecamatan,
      alamatLengkapTujuan: row.alamat_lengkap_tujuan,
      noHpPenerima: row.no_hp_penerima,
      keteranganDoc: row.keterangan_doc,

      tarifId: row.tarif_id,
      areaDistribusi: row.area_distribusi,
      tujuanKirim: row.tujuan_kirim,
      biayaEkspedisi: Number(row.biaya_ekspedisi || 0),
      pph2Persen: Number(row.pph2_persen || 2),
      totalSetelahPPh: Number(row.total_setelah_pph || 0),

      itemsBarang: typeof row.items_barang === "string" ? JSON.parse(row.items_barang || "[]") : (row.items_barang || []),
      namaBarang: row.nama_barang,
      jumlahKoli: Number(row.jumlah_koli || 0),
      totalNilaiBarang: Number(row.total_nilai_barang || 0),
      beratBarangKg: Number(row.berat_barang_kg || 0),
      catatanBarang: row.catatan_barang,

      status: row.status,
      dibuatOleh: typeof row.dibuat_oleh === "string" ? JSON.parse(row.dibuat_oleh || "null") : row.dibuat_oleh,

      disetujuiOleh: typeof row.disetujui_oleh === "string" ? JSON.parse(row.disetujui_oleh || "null") : row.disetujui_oleh,
      disetujuiPada: row.disetujui_pada?.toISOString?.() || row.disetujui_pada,
      catatanDirektur: row.catatan_direktur,

      namaPenerimaBarang: row.nama_penerima_barang,
      catatanPelaporan: row.catatan_pelaporan,
      buktiPengirimanUrl: row.bukti_pengiriman_url,
      tanggalDiterima: row.tanggal_diterima?.toISOString?.() || row.tanggal_diterima,

      dikonfirmasiOleh: typeof row.dikonfirmasi_oleh === "string" ? JSON.parse(row.dikonfirmasi_oleh || "null") : row.dikonfirmasi_oleh,
      dikonfirmasiPada: row.dikonfirmasi_pada?.toISOString?.() || row.dikonfirmasi_pada,
      catatanKonfirmasiDirektur: row.catatan_konfirmasi_direktur,

      createdAt: row.created_at?.toISOString?.() || row.created_at,
      updatedAt: row.updated_at?.toISOString?.() || row.updated_at,
    });
  }

  /**
   * Map DeliveryOrder entity (camelCase) → MySQL column values (snake_case)
   */
  _toRow(order) {
    return {
      id: order.id,
      no_do: order.noDO,
      tanggal_kirim: order.tanggalKirim || null,

      no_schedule: order.noSchedule || null,
      tgl_schedule: order.tglSchedule || null,
      tipe_mobil_rit: order.tipeMobilRit || null,
      gudang_asal: order.gudangAsal || null,
      nama_supir: order.namaSupir || null,
      no_hp_supir: order.noHpSupir || null,
      no_polisi_kendaraan: order.noPolisiKendaraan || null,
      jenis_kendaraan: order.jenisKendaraan || null,

      no_doc_perusahaan: order.noDocPerusahaan || null,
      tgl_doc_perusahaan: order.tglDocPerusahaan || null,
      nama_toko: order.namaToko || null,
      salesman: order.salesman || null,
      agen: order.agen || null,
      kota: order.kota || null,
      kecamatan: order.kecamatan || null,
      alamat_lengkap_tujuan: order.alamatLengkapTujuan || null,
      no_hp_penerima: order.noHpPenerima || null,
      keterangan_doc: order.keteranganDoc || null,

      tarif_id: order.tarifId || null,
      area_distribusi: order.areaDistribusi || null,
      tujuan_kirim: order.tujuanKirim || null,
      biaya_ekspedisi: Number(order.biayaEkspedisi || 0),
      pph2_persen: Number(order.pph2Persen || 2),
      total_setelah_pph: Number(order.totalSetelahPPh || 0),

      items_barang: JSON.stringify(order.itemsBarang || []),
      nama_barang: order.namaBarang || null,
      jumlah_koli: Number(order.jumlahKoli || 0),
      total_nilai_barang: Number(order.totalNilaiBarang || 0),
      berat_barang_kg: Number(order.beratBarangKg || 0),
      catatan_barang: order.catatanBarang || null,

      status: order.status || "DRAFT",
      dibuat_oleh: order.dibuatOleh ? JSON.stringify(order.dibuatOleh) : null,

      disetujui_oleh: order.disetujuiOleh ? JSON.stringify(order.disetujuiOleh) : null,
      disetujui_pada: order.disetujuiPada || null,
      catatan_direktur: order.catatanDirektur || null,

      nama_penerima_barang: order.namaPenerimaBarang || null,
      catatan_pelaporan: order.catatanPelaporan || null,
      bukti_pengiriman_url: order.buktiPengirimanUrl || null,
      tanggal_diterima: order.tanggalDiterima || null,

      dikonfirmasi_oleh: order.dikonfirmasiOleh ? JSON.stringify(order.dikonfirmasiOleh) : null,
      dikonfirmasi_pada: order.dikonfirmasiPada || null,
      catatan_konfirmasi_direktur: order.catatanKonfirmasiDirektur || null,
    };
  }

  async create(order) {
    const row = this._toRow(order);
    const columns = Object.keys(row);
    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((col) => row[col]);

    await this.pool.query(
      `INSERT INTO delivery_orders (${columns.join(", ")}) VALUES (${placeholders})`,
      values
    );
    return this._toEntity({ ...row, created_at: new Date(), updated_at: new Date() });
  }

  async update(order) {
    // Fetch existing row first
    const [existing] = await this.pool.query(
      "SELECT * FROM delivery_orders WHERE id = ? LIMIT 1",
      [order.id]
    );
    if (existing.length === 0) {
      throw new Error("Data Surat Jalan (DO) tidak ditemukan");
    }

    // Merge existing with updated data
    const merged = { ...existing[0] };

    // Map incoming camelCase fields to snake_case for update
    const updateMap = this._toRow(order);
    
    // Build SET clause only for non-null fields that are different
    const setClauses = [];
    const setValues = [];

    for (const [col, val] of Object.entries(updateMap)) {
      if (col === "id") continue;
      setClauses.push(`\`${col}\` = ?`);
      setValues.push(val);
    }

    setClauses.push("`updated_at` = NOW()");
    setValues.push(order.id); // for WHERE

    await this.pool.query(
      `UPDATE delivery_orders SET ${setClauses.join(", ")} WHERE id = ?`,
      setValues
    );

    // Return updated entity
    const [updated] = await this.pool.query(
      "SELECT * FROM delivery_orders WHERE id = ? LIMIT 1",
      [order.id]
    );
    return this._toEntity(updated[0]);
  }

  async findById(id) {
    const [rows] = await this.pool.query(
      "SELECT * FROM delivery_orders WHERE id = ? LIMIT 1",
      [id]
    );
    return this._toEntity(rows[0]);
  }

  async list() {
    const [rows] = await this.pool.query(
      "SELECT * FROM delivery_orders ORDER BY created_at DESC"
    );
    return rows.map((r) => this._toEntity(r));
  }

  async listByStatus(status) {
    const [rows] = await this.pool.query(
      "SELECT * FROM delivery_orders WHERE status = ? ORDER BY created_at DESC",
      [status]
    );
    return rows.map((r) => this._toEntity(r));
  }

  async count() {
    const [rows] = await this.pool.query("SELECT COUNT(*) as cnt FROM delivery_orders");
    return rows[0].cnt;
  }
}
