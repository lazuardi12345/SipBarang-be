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
      userId: order.userId || null,
      catatanKonfirmasiDirektur: order.catatanKonfirmasiDirektur || null,
      confirmedAt: order.confirmedAt || null,
    };

    return Object.values(payload).some((value) => value !== null && value !== undefined && value !== "")
      ? payload
      : null;
  }
}
