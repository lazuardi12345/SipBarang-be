/**
 * Domain Entity: Invoice
 */
export const StatusInvoice = Object.freeze({
  BELUM_LUNAS: "BELUM_LUNAS",
  LUNAS: "LUNAS",
});

function getDestination(value) {
  const segments = String(value || "-")
    .split(/\s*(?:->|[-–—])\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  return segments[segments.length - 1] || "-";
}

export class Invoice {
  constructor(data) {
    this.id = data.id;
    this.noInvoice = data.noInvoice;
    this.tanggalInvoice = data.tanggalInvoice || new Date().toISOString();
    this.namaPelanggan = data.namaPelanggan;
    this.alamatPelanggan = data.alamatPelanggan || "";
    this.items = data.items || data.deliveryOrders || [];
    this.deliveryOrders = this.items; // alias for backwards/template compatibility
    this.groupedItems = this._groupItems(this.items);

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
    this.verificationToken = data.verificationToken || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  _groupItems(items) {
    const groups = new Map();

    for (const item of items) {
      const description =
        (item.namaBarang && item.namaBarang !== "-" ? item.namaBarang : "") ||
        item.keteranganDoc ||
        "-";
      const area = item.tujuanKirim || item.areaDistribusi || getDestination(item.tujuanKirim);
      const unitPrice = Number(item.biayaEkspedisi ?? item.tarifPengiriman ?? 0);
      const key = JSON.stringify([description, area, unitPrice]);
      const pph2 = Number(item.pph2 ?? Math.round(unitPrice * 0.02));
      const totalNetto = Number(item.totalSetelahPPh ?? item.totalSetelahPph ?? (unitPrice - pph2));
      const group = groups.get(key) || {
        description,
        area,
        unitPrice,
        quantity: 0,
        totalNetto: 0,
      };

      group.quantity += 1;
      group.totalNetto += totalNetto;
      groups.set(key, group);
    }

    return Array.from(groups.values());
  }
}
