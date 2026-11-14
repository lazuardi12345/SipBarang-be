import { IPengeluaranLainRepository } from "../../domain/repositories/IPengeluaranLainRepository.js";
import { PengeluaranLain } from "../../domain/entities/PengeluaranLain.js";

function toDateString(value) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return null;
}

export class MysqlPengeluaranLainRepository extends IPengeluaranLainRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  toDomain(row) {
    if (!row) return null;
    return new PengeluaranLain({
      id: row.id,
      tanggal: toDateString(row.tanggal),
      kategori: row.kategori,
      nominal: Number(row.nominal) || 0,
      keterangan: row.keterangan,
      dibuatOleh: row.dibuatOleh,
      catatan: row.catatan,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
    });
  }

  async findAll(options = {}) {
    const where = {};

    if (options.startDate || options.endDate) {
      where.tanggal = {};
      if (options.startDate) {
        where.tanggal.gte = new Date(options.startDate);
      }
      if (options.endDate) {
        where.tanggal.lte = new Date(options.endDate);
      }
    }

    if (options.kategori && options.kategori !== "SEMUA") {
      where.kategori = options.kategori;
    }

    const rows = await this.prisma.pengeluaranLain.findMany({
      where,
      orderBy: {
        tanggal: "desc",
      },
    });

    return rows.map((r) => this.toDomain(r));
  }

  async findById(id) {
    const row = await this.prisma.pengeluaranLain.findUnique({
      where: { id },
    });
    return this.toDomain(row);
  }

  async create(pengeluaran) {
    const row = await this.prisma.pengeluaranLain.create({
      data: {
        id: pengeluaran.id || undefined,
        tanggal: pengeluaran.tanggal ? new Date(pengeluaran.tanggal) : new Date(),
        kategori: pengeluaran.kategori || "Lainnya",
        nominal: pengeluaran.nominal || 0,
        keterangan: pengeluaran.keterangan || "",
        dibuatOleh: pengeluaran.dibuatOleh || null,
        catatan: pengeluaran.catatan || null,
      },
    });
    return this.toDomain(row);
  }

  async update(pengeluaran) {
    const row = await this.prisma.pengeluaranLain.update({
      where: { id: pengeluaran.id },
      data: {
        tanggal: pengeluaran.tanggal ? new Date(pengeluaran.tanggal) : undefined,
        kategori: pengeluaran.kategori,
        nominal: pengeluaran.nominal,
        keterangan: pengeluaran.keterangan,
        dibuatOleh: pengeluaran.dibuatOleh,
        catatan: pengeluaran.catatan,
      },
    });
    return this.toDomain(row);
  }

  async delete(id) {
    await this.prisma.pengeluaranLain.delete({
      where: { id },
    });
    return true;
  }
}

