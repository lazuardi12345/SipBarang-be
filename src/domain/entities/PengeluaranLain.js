export class PengeluaranLain {
  constructor({
    id,
    tanggal,
    kategori = "Lainnya",
    nominal = 0,
    keterangan = "",
    dibuatOleh = null,
    catatan = null,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.tanggal = tanggal || new Date().toISOString().slice(0, 10);
    this.kategori = kategori || "Lainnya";
    this.nominal = Number(nominal) || 0;
    this.keterangan = keterangan || "";
    this.dibuatOleh = dibuatOleh || null;
    this.catatan = catatan || null;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      tanggal: this.tanggal,
      kategori: this.kategori,
      nominal: this.nominal,
      keterangan: this.keterangan,
      dibuatOleh: this.dibuatOleh,
      catatan: this.catatan,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

