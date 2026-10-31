/**
 * Domain Entity: Tarif
 */
export class Tarif {
  constructor({ id, areaDistribusi, tujuanKirim, total, active = true }) {
    this.id = id;
    this.areaDistribusi = areaDistribusi;
    this.tujuanKirim = tujuanKirim;
    this.total = Number(total);
    this.active = active;
  }
}
