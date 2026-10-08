/**
 * DeliveryOrderDocumentRepository
 * Mapping khusus untuk table delivery_order_documents.
 */
export class DeliveryOrderDocumentRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  _firstDefined(...values) {
    return values.find((value) => value !== undefined && value !== null && value !== "");
  }

  _normalizeDate(value) {
    if (value === undefined || value === null || value === "") return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

    const raw = String(value).trim();
    if (!raw) return null;

    const isoValue = raw.length === 10 ? `${raw}T00:00:00.000Z` : raw;
    const date = new Date(isoValue);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  toPrismaData(order = {}) {
    const payload = {
      noDocPerusahaan: order.noDocPerusahaan || null,
      tglDocPerusahaan: this._normalizeDate(order.tglDocPerusahaan),
      namaToko: order.namaToko || null,
      salesman: order.salesman || null,
      agen: order.agen || null,
      kota: order.kota || null,
      kecamatan: order.kecamatan || null,
      alamatLengkapTujuan: order.alamatLengkapTujuan || null,
      noHpPenerima: order.noHpPenerima || null,
      keteranganDoc: order.keteranganDoc || null,
    };

    return Object.values(payload).some((value) => value !== null && value !== undefined && value !== "")
      ? payload
      : null;
  }

  toEntity(row = {}) {
    return {
      noDocPerusahaan: this._firstDefined(row.noDocPerusahaan),
      tglDocPerusahaan: row.tglDocPerusahaan,
      namaToko: this._firstDefined(row.namaToko),
      salesman: this._firstDefined(row.salesman),
      agen: this._firstDefined(row.agen),
      kota: this._firstDefined(row.kota),
      kecamatan: this._firstDefined(row.kecamatan),
      alamatLengkapTujuan: this._firstDefined(row.alamatLengkapTujuan),
      noHpPenerima: this._firstDefined(row.noHpPenerima),
      keteranganDoc: this._firstDefined(row.keteranganDoc),
    };
  }

  async upsert(orderId, order) {
    const data = this.toPrismaData(order);
    if (!data) return null;

    return this.prisma.deliveryOrderDocument.upsert({
      where: { orderId },
      create: { orderId, ...data },
      update: data,
    });
  }
}
