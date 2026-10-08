/**
 * MysqlTarifRepository — Implementasi ITarifRepository menggunakan Prisma.
 */
import { ITarifRepository } from "../../domain/repositories/ITarifRepository.js";
import { Tarif } from "../../domain/entities/Tarif.js";

export class MysqlTarifRepository extends ITarifRepository {
  constructor(prismaClient) {
    super();
    this.prisma = prismaClient;
  }

  _toEntity(row) {
    if (!row) return null;
    return new Tarif({
      id: row.id,
      areaDistribusi: row.areaDistribusi,
      tujuanKirim: row.tujuanKirim,
      total: Number(row.total || 0),
      totalSetelahPPh: Number(row.totalSetelahPPh ?? row.total ?? 0),
    });
  }

  async list() {
    const rows = await this.prisma.tarif.findMany({
      orderBy: [{ areaDistribusi: "asc" }, { tujuanKirim: "asc" }],
    });
    return rows.map((r) => this._toEntity(r));
  }

  async findById(id) {
    const row = await this.prisma.tarif.findUnique({
      where: { id },
    });
    return this._toEntity(row);
  }

  async create(tarif) {
    const row = await this.prisma.tarif.create({
      data: {
        id: tarif.id,
        areaDistribusi: tarif.areaDistribusi,
        tujuanKirim: tarif.tujuanKirim,
        total: Number(tarif.total),
        totalSetelahPPh: Number(tarif.totalSetelahPPh),
      },
    });
    return this._toEntity(row);
  }

  async update(tarif) {
    const row = await this.prisma.tarif.update({
      where: { id: tarif.id },
      data: {
        areaDistribusi: tarif.areaDistribusi,
        tujuanKirim: tarif.tujuanKirim,
        total: Number(tarif.total),
        totalSetelahPPh: Number(tarif.totalSetelahPPh),
      },
    });
    return this._toEntity(row);
  }

  async delete(id) {
    const row = await this.prisma.tarif.delete({
      where: { id },
    });
    return this._toEntity(row);
  }
}
