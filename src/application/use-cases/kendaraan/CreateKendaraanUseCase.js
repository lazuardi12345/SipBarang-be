import { Kendaraan } from "../../../domain/entities/Kendaraan.js";

export class CreateKendaraanUseCase {
  constructor(kendaraanRepository) {
    this.kendaraanRepository = kendaraanRepository;
  }

  async execute(input) {
    const noPolisi = String(input.noPolisi || "").trim().toUpperCase();
    const tipeMobil = String(input.tipeMobil || "").trim();
    const kepemilikan = input.kepemilikan === "ORANG_LAIN" ? "ORANG_LAIN" : "MILIK_PRIBADI";
    const namaPemilik = kepemilikan === "ORANG_LAIN" ? String(input.namaPemilik || "").trim() : null;
    const catatan = input.catatan ? String(input.catatan).trim() : null;

    if (!noPolisi) {
      const error = new Error("Nomor polisi / plat kendaraan wajib diisi");
      error.statusCode = 400;
      throw error;
    }

    if (!tipeMobil) {
      const error = new Error("Tipe / jenis mobil wajib diisi (contoh: CDD Box, Fuso, Tronton)");
      error.statusCode = 400;
      throw error;
    }

    if (kepemilikan === "ORANG_LAIN" && !namaPemilik) {
      const error = new Error("Nama pemilik / vendor wajib diisi jika kendaraan milik orang lain");
      error.statusCode = 400;
      throw error;
    }

    const existing = await this.kendaraanRepository.findByNoPolisi(noPolisi);
    if (existing) {
      const error = new Error(`Kendaraan dengan plat nomor ${noPolisi} sudah terdaftar`);
      error.statusCode = 409;
      throw error;
    }

    return this.kendaraanRepository.create(
      new Kendaraan({
        noPolisi,
        tipeMobil,
        kepemilikan,
        namaPemilik,
        catatan,
      })
    );
  }
}

