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
    const totalSetelahPPh = Number(input.totalSetelahPPh ?? existing.totalSetelahPPh ?? total ?? 0);

    if (!areaDistribusi || !tujuanKirim) {
      const error = new Error("Area distribusi dan tujuan kirim wajib diisi");
      error.statusCode = 400;
      throw error;
    }

    if (!Number.isFinite(total) || total < 0 || !Number.isFinite(totalSetelahPPh) || totalSetelahPPh < 0) {
      const error = new Error("Tarif harus berupa angka yang tidak negatif");
      error.statusCode = 400;
      throw error;
    }

    return this.tarifRepository.update(
      new Tarif({
        id,
        areaDistribusi,
        tujuanKirim,
        total,
        totalSetelahPPh,
      })
    );
  }
}
