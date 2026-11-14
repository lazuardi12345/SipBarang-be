import { PengeluaranLain } from "../../../domain/entities/PengeluaranLain.js";

export class CreatePengeluaranLainUseCase {
  constructor(pengeluaranLainRepository) {
    this.pengeluaranLainRepository = pengeluaranLainRepository;
  }

  async execute(input, user = null) {
    const nominal = Number(input.nominal);
    if (!Number.isFinite(nominal) || nominal <= 0) {
      const err = new Error("Nominal pengeluaran harus berupa angka valid dan lebih besar dari 0");
      err.statusCode = 400;
      throw err;
    }

    const keterangan = (input.keterangan || "").trim();
    if (!keterangan) {
      const err = new Error("Catatan / peruntukan pengeluaran wajib diisi");
      err.statusCode = 400;
      throw err;
    }

    const pengeluaran = new PengeluaranLain({
      tanggal: input.tanggal || new Date().toISOString().slice(0, 10),
      kategori: (input.kategori || "Lainnya").trim(),
      nominal,
      keterangan,
      dibuatOleh: user?.nama || input.dibuatOleh || null,
      catatan: (input.catatan || "").trim() || null,
    });

    return this.pengeluaranLainRepository.create(pengeluaran);
  }
}

