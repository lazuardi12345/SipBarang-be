/**
 * MysqlKendaraanRepository — Implementasi IKendaraanRepository menggunakan Prisma.
 */
import { IKendaraanRepository } from "../../domain/repositories/IKendaraanRepository.js";
import { Kendaraan } from "../../domain/entities/Kendaraan.js";
import { nextSequentialId } from "../database/sequentialId.js";

export class MysqlKendaraanRepository extends IKendaraanRepository {
  constructor(prismaClient) {
    super();
    this.prisma = prismaClient;
  }

  _toEntity(row) {
    if (!row) return null;
    return new Kendaraan({
      id: row.id,
      noPolisi: row.noPolisi,
      tipeMobil: row.tipeMobil,
      kepemilikan: row.kepemilikan,
      namaPemilik: row.namaPemilik,
      catatan: row.catatan,
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async list() {
    const rows = await this.prisma.kendaraan.findMany({
      where: { active: true },
      orderBy: [{ kepemilikan: "asc" }, { noPolisi: "asc" }],
    });
    return rows.map((r) => this._toEntity(r));
  }

  async findById(id) {
    const row = await this.prisma.kendaraan.findUnique({
      where: { id },
    });
    return this._toEntity(row);
  }

  async findByNoPolisi(noPolisi) {
    const normalized = String(noPolisi || "").trim().toUpperCase();
    const row = await this.prisma.kendaraan.findFirst({
      where: { noPolisi: normalized, active: true },
    });
    return this._toEntity(row);
  }

  async create(kendaraan) {
    const row = await this.prisma.kendaraan.create({
      data: {
        id: await nextSequentialId(this.prisma, "kendaraans"),
        noPolisi: String(kendaraan.noPolisi || "").trim().toUpperCase(),
        tipeMobil: String(kendaraan.tipeMobil || "").trim(),
        kepemilikan: kendaraan.kepemilikan === "ORANG_LAIN" ? "ORANG_LAIN" : "MILIK_PRIBADI",
        namaPemilik: kendaraan.kepemilikan === "ORANG_LAIN" ? (kendaraan.namaPemilik ? String(kendaraan.namaPemilik).trim() : null) : null,
        catatan: kendaraan.catatan ? String(kendaraan.catatan).trim() : null,
        active: true,
      },
    });
    return this._toEntity(row);
  }

  async update(kendaraan) {
    const row = await this.prisma.kendaraan.update({
      where: { id: kendaraan.id },
      data: {
        noPolisi: String(kendaraan.noPolisi || "").trim().toUpperCase(),
        tipeMobil: String(kendaraan.tipeMobil || "").trim(),
        kepemilikan: kendaraan.kepemilikan === "ORANG_LAIN" ? "ORANG_LAIN" : "MILIK_PRIBADI",
        namaPemilik: kendaraan.kepemilikan === "ORANG_LAIN" ? (kendaraan.namaPemilik ? String(kendaraan.namaPemilik).trim() : null) : null,
        catatan: kendaraan.catatan ? String(kendaraan.catatan).trim() : null,
      },
    });
    return this._toEntity(row);
  }

  async delete(id) {
    const row = await this.prisma.kendaraan.update({
      where: { id },
      data: { active: false },
    });
    return this._toEntity(row);
  }
}

