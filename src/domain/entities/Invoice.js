/**
 * Domain Entity: Invoice
 */
export const StatusInvoice = Object.freeze({
  BELUM_LUNAS: "BELUM_LUNAS",
  LUNAS: "LUNAS",
});

export class Invoice {
  constructor(data) {
    this.id = data.id;
    this.noInvoice = data.noInvoice;
    this.tanggalInvoice = data.tanggalInvoice || new Date().toISOString();
    this.namaPelanggan = data.namaPelanggan;
    this.alamatPelanggan = data.alamatPelanggan || "";
    this.items = data.items || data.deliveryOrders || [];
    this.deliveryOrders = this.items; // alias for backwards/template compatibility

    const subtotal = Number(data.subtotal || 0);
    const computedPph2 = Number(data.totalPPh2 ?? data.totalPPh ?? (subtotal * 0.02) ?? 0);
    const computedTagihan = Number(data.totalTagihan ?? data.totalBersih ?? (subtotal - computedPph2) ?? 0);

    this.subtotal = subtotal;
    this.totalPPh2 = computedPph2;
    this.totalPPh = this.totalPPh2;
    this.totalTagihan = computedTagihan;
    this.totalBersih = this.totalTagihan;
    this.status = data.status || StatusInvoice.BELUM_LUNAS;
    this.dibuatOleh = data.dibuatOleh; // { id, nama, role }
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }
}
