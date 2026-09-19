/**
 * Domain Entity: Tarif
 */
export class Tarif {
  constructor({ id, areaDistribusi, tujuanKirim, total, totalSetelahPPh }) {
    this.id = id;
    this.areaDistribusi = areaDistribusi;
    this.tujuanKirim = tujuanKirim;
    this.total = Number(total);
    this.totalSetelahPPh = Number(totalSetelahPPh);
  }
}
