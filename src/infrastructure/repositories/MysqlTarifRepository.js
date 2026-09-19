/**
 * MysqlTarifRepository — Implementasi ITarifRepository menggunakan MySQL.
 */
import { ITarifRepository } from "../../domain/repositories/ITarifRepository.js";
import { Tarif } from "../../domain/entities/Tarif.js";

export class MysqlTarifRepository extends ITarifRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  _toEntity(row) {
    if (!row) return null;
    return new Tarif({
      id: row.id,
      areaDistribusi: row.area_distribusi,
      tujuanKirim: row.tujuan_kirim,
      total: Number(row.total),
      totalSetelahPPh: Number(row.total_setelah_pph),
    });
  }

  async list() {
    const [rows] = await this.pool.query(
      "SELECT * FROM tarifs ORDER BY area_distribusi, tujuan_kirim"
    );
    return rows.map((r) => this._toEntity(r));
  }

  async findById(id) {
    const [rows] = await this.pool.query("SELECT * FROM tarifs WHERE id = ? LIMIT 1", [id]);
    return this._toEntity(rows[0]);
  }

  async create(tarif) {
    await this.pool.query(
      "INSERT INTO tarifs (id, area_distribusi, tujuan_kirim, total, total_setelah_pph) VALUES (?, ?, ?, ?, ?)",
      [tarif.id, tarif.areaDistribusi, tarif.tujuanKirim, tarif.total, tarif.totalSetelahPPh]
    );
    return this._toEntity(tarif);
  }
}
