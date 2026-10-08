/**
 * DeliveryOrderScheduleRepository
 * Mapping khusus untuk table delivery_order_schedules.
 */
export class DeliveryOrderScheduleRepository {
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
      noSchedule: order.noSchedule || null,
      tglSchedule: this._normalizeDate(order.tglSchedule),
      tipeMobilRit: order.tipeMobilRit || null,
      gudangAsal: order.gudangAsal || null,
      namaSupir: order.namaSupir || null,
      noHpSupir: order.noHpSupir || null,
      noPolisiKendaraan: order.noPolisiKendaraan || null,
      jenisKendaraan: order.jenisKendaraan || null,
    };

    return Object.values(payload).some((value) => value !== null && value !== undefined && value !== "")
      ? payload
      : null;
  }

  toEntity(row = {}) {
    return {
      noSchedule: this._firstDefined(row.noSchedule),
      tglSchedule: row.tglSchedule,
      tipeMobilRit: this._firstDefined(row.tipeMobilRit),
      gudangAsal: this._firstDefined(row.gudangAsal),
      namaSupir: this._firstDefined(row.namaSupir),
      noHpSupir: this._firstDefined(row.noHpSupir),
      noPolisiKendaraan: this._firstDefined(row.noPolisiKendaraan),
      jenisKendaraan: this._firstDefined(row.jenisKendaraan),
    };
  }

  async upsert(orderId, order) {
    const data = this.toPrismaData(order);
    if (!data) return null;

    return this.prisma.deliveryOrderSchedule.upsert({
      where: { orderId },
      create: { orderId, ...data },
      update: data,
    });
  }
}
