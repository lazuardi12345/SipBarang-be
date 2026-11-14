/**
 * Domain Entity: Kendaraan
 */
export class Kendaraan {
  constructor({
    id,
    noPolisi,
    tipeMobil,
    kepemilikan = "MILIK_PRIBADI",
    namaPemilik = null,
    catatan = null,
    active = true,
    createdAt = null,
    updatedAt = null,
  }) {
    this.id = id;
    this.noPolisi = String(noPolisi || "").trim().toUpperCase();
    this.tipeMobil = String(tipeMobil || "").trim();
    this.kepemilikan = kepemilikan === "ORANG_LAIN" ? "ORANG_LAIN" : "MILIK_PRIBADI";
    this.namaPemilik = this.kepemilikan === "ORANG_LAIN" ? (namaPemilik ? String(namaPemilik).trim() : null) : null;
    this.catatan = catatan ? String(catatan).trim() : null;
    this.active = active !== false;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

