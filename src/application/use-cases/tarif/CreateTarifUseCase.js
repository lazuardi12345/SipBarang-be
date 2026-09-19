import crypto from "crypto";
import { Tarif } from "../../../domain/entities/Tarif.js";

export class CreateTarifUseCase {
  constructor(tarifRepository) {
    this.tarifRepository = tarifRepository;
  }

  async execute(input) {
    const areaDistribusi = String(input.areaDistribusi || "").trim();
    const tujuanKirim = String(input.tujuanKirim || "").trim();
    const total = Number(input.total);
    const totalSetelahPPh = Number(input.totalSetelahPPh);

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

    const existing = await this.tarifRepository.list();
    const duplicate = existing.some(
      (tarif) =>
        tarif.areaDistribusi.toLowerCase() === areaDistribusi.toLowerCase() &&
        tarif.tujuanKirim.toLowerCase() === tujuanKirim.toLowerCase()
    );

    if (duplicate) {
      const error = new Error("Tujuan dengan area tersebut sudah terdaftar");
      error.statusCode = 409;
      throw error;
    }

    return this.tarifRepository.create(
      new Tarif({
        id: `tarif-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
        areaDistribusi,
        tujuanKirim,
        total,
        totalSetelahPPh,
      })
    );
  }
}