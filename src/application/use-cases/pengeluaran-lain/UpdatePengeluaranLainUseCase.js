export class UpdatePengeluaranLainUseCase {
  constructor(pengeluaranLainRepository) {
    this.pengeluaranLainRepository = pengeluaranLainRepository;
  }

  async execute(id, input, user = null) {
    const existing = await this.pengeluaranLainRepository.findById(id);
    if (!existing) {
      const err = new Error("Data pengeluaran tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    const nominal = input.nominal !== undefined ? Number(input.nominal) : existing.nominal;
    if (!Number.isFinite(nominal) || nominal <= 0) {
      const err = new Error("Nominal pengeluaran harus berupa angka valid dan lebih besar dari 0");
      err.statusCode = 400;
      throw err;
    }

    const keterangan = input.keterangan !== undefined ? input.keterangan.trim() : existing.keterangan;
    if (!keterangan) {
      const err = new Error("Catatan / peruntukan pengeluaran wajib diisi");
      err.statusCode = 400;
      throw err;
    }

    const updated = {
      ...existing,
      tanggal: input.tanggal ? input.tanggal.slice(0, 10) : existing.tanggal,
      kategori: input.kategori !== undefined ? input.kategori.trim() : existing.kategori,
      nominal,
      keterangan,
      catatan: input.catatan !== undefined ? input.catatan.trim() : existing.catatan,
      dibuatOleh: existing.dibuatOleh || user?.nama || null,
    };

    return this.pengeluaranLainRepository.update(updated);
  }
}

