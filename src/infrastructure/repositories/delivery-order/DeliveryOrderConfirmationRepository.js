/**
 * DeliveryOrderConfirmationRepository
 * Mapping khusus untuk table delivery_order_confirmations.
 */
export class DeliveryOrderConfirmationRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  toPrismaData(order = {}) {
    const payload = {
      userId: order.konfirmasiUserId || order.userId || null,
      catatanKonfirmasiDirektur: order.catatanKonfirmasiDirektur || null,
      confirmedAt: order.dikonfirmasiPada || order.confirmedAt || null,
    };

    if (!payload.userId || !payload.confirmedAt) {
      const err = new Error("ID Direktur dan waktu konfirmasi wajib tersedia untuk menyimpan konfirmasi");
      err.statusCode = 400;
      throw err;
    }

    return payload;
  }

  async create(orderId, order) {
    return this.prisma.deliveryOrderConfirmation.create({
      data: {
        orderId,
        ...this.toPrismaData(order),
      },
    });
  }
}
