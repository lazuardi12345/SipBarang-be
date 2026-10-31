import { Tarif } from "../../../domain/entities/Tarif.js";

export class UpdateTarifUseCase {
  constructor(tarifRepository) {
    this.tarifRepository = tarifRepository;
  }

  async execute(id, input) {
    const existing = await this.tarifRepository.findById(id);
    if (!existing) {
      const error = new Error("Data tarif tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const areaDistribusi = String(input.areaDistribusi ?? existing.areaDistribusi ?? "").trim();
    const tujuanKirim = String(input.tujuanKirim ?? existing.tujuanKirim ?? "").trim();
    const total = Number(input.total ?? existing.total ?? 0);

    if (!areaDistribusi || !tujuanKirim) {
      const error = new Error("Area distribusi dan tujuan kirim wajib diisi");
      error.statusCode = 400;
      throw error;
    }

    if (!Number.isFinite(total) || total < 0) {
      const error = new Error("Tarif harus berupa angka yang tidak negatif");
      error.statusCode = 400;
      throw error;
    }

    const existingTarifs = await this.tarifRepository.list();
    const duplicate = existingTarifs.some(
      (tarif) =>
        tarif.id !== id &&
        tarif.areaDistribusi.trim().toLowerCase() === areaDistribusi.toLowerCase() &&
        tarif.tujuanKirim.trim().toLowerCase() === tujuanKirim.toLowerCase() &&
        Number(tarif.total) === total
    );

    if (duplicate) {
      const error = new Error("Rute dengan tarif tersebut sudah terdaftar");
      error.statusCode = 409;
      throw error;
    }

    return this.tarifRepository.update(
      new Tarif({
        id,
        areaDistribusi,
        tujuanKirim,
        total,
      })
    );
  }
}
