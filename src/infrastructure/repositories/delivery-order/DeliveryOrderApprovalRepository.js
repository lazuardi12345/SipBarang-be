/**
 * DeliveryOrderApprovalRepository
 * Mapping khusus untuk table delivery_order_approvals.
 */
export class DeliveryOrderApprovalRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  toPrismaData(order = {}) {
    const payload = {
      userId: order.userId || null,
      action: order.action || null,
      note: order.note || null,
    };

    return Object.values(payload).some((value) => value !== null && value !== undefined && value !== "")
      ? payload
      : null;
  }
}
