/**
 * DeliveryOrderReportRepository
 * Mapping khusus untuk table delivery_order_reports.
 */
export class DeliveryOrderReportRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  _firstDefined(...values) {
    return values.find((value) => value !== undefined && value !== null && value !== "");
  }

  toPrismaData(order = {}) {
    const payload = {
      namaPenerimaBarang: order.namaPenerimaBarang || null,
      catatanPelaporan: order.catatanPelaporan || null,
      buktiPengirimanUrl: order.buktiPengirimanUrl || null,
      tanggalDiterima: order.tanggalDiterima || null,
    };

    return Object.values(payload).some((value) => value !== null && value !== undefined && value !== "")
      ? payload
      : null;
  }

  toEntity(row = {}) {
    return {
      namaPenerimaBarang: this._firstDefined(row.namaPenerimaBarang),
      catatanPelaporan: this._firstDefined(row.catatanPelaporan),
      buktiPengirimanUrl: this._firstDefined(row.buktiPengirimanUrl),
      tanggalDiterima: row.tanggalDiterima,
    };
  }

  async upsert(orderId, order) {
    const data = this.toPrismaData(order);
    if (!data) return null;

    const existing = await this.prisma.deliveryOrderReport.findFirst({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      return this.prisma.deliveryOrderReport.update({
        where: { id: existing.id },
        data,
      });
    }

    return this.prisma.deliveryOrderReport.create({
      data: { orderId, ...data },
    });
  }
}
