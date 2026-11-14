import { Kendaraan } from "../../../domain/entities/Kendaraan.js";

export class UpdateKendaraanUseCase {
  constructor(kendaraanRepository) {
    this.kendaraanRepository = kendaraanRepository;
  }

  async execute(id, input) {
    const existing = await this.kendaraanRepository.findById(id);
    if (!existing || !existing.active) {
      const error = new Error("Kendaraan tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const noPolisi = String(input.noPolisi || existing.noPolisi).trim().toUpperCase();
    const tipeMobil = String(input.tipeMobil || existing.tipeMobil).trim();
    const kepemilikan = input.kepemilikan !== undefined
      ? (input.kepemilikan === "ORANG_LAIN" ? "ORANG_LAIN" : "MILIK_PRIBADI")
      : existing.kepemilikan;
    const namaPemilik = kepemilikan === "ORANG_LAIN"
      ? String(input.namaPemilik !== undefined ? input.namaPemilik : existing.namaPemilik || "").trim()
      : null;
    const catatan = input.catatan !== undefined
      ? (input.catatan ? String(input.catatan).trim() : null)
      : existing.catatan;

    if (!noPolisi) {
      const error = new Error("Nomor polisi / plat kendaraan wajib diisi");
      error.statusCode = 400;
      throw error;
    }

    if (!tipeMobil) {
      const error = new Error("Tipe / jenis mobil wajib diisi");
      error.statusCode = 400;
      throw error;
    }

    if (kepemilikan === "ORANG_LAIN" && !namaPemilik) {
      const error = new Error("Nama pemilik / vendor wajib diisi jika kendaraan milik orang lain");
      error.statusCode = 400;
      throw error;
    }

    // Check duplicate plat if changed
    if (noPolisi !== existing.noPolisi) {
      const duplicate = await this.kendaraanRepository.findByNoPolisi(noPolisi);
      if (duplicate && duplicate.id !== id) {
        const error = new Error(`Kendaraan dengan plat nomor ${noPolisi} sudah terdaftar`);
        error.statusCode = 409;
        throw error;
      }
    }

    return this.kendaraanRepository.update(
      new Kendaraan({
        id,
        noPolisi,
        tipeMobil,
        kepemilikan,
        namaPemilik,
        catatan,
      })
    );
  }
}

