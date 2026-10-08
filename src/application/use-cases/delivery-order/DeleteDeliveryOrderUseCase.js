import { StatusDO } from "../../../domain/entities/DeliveryOrder.js";

export class DeleteDeliveryOrderUseCase {
  constructor(deliveryOrderRepository) {
    this.deliveryOrderRepository = deliveryOrderRepository;
  }

  async execute(orderId) {
    const order = await this.deliveryOrderRepository.findById(orderId);

    if (!order) {
      const err = new Error("Data Surat Jalan / Pengiriman tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    if (![StatusDO.DRAFT, StatusDO.PLANNING, StatusDO.MENUNGGU_ACC, StatusDO.DITOLAK].includes(order.status)) {
      const err = new Error(
        `Surat Jalan tidak dapat dihapus karena status saat ini: ${order.status}. Hanya data draft, planning, menunggu ACC, atau ditolak yang bisa dihapus.`
      );
      err.statusCode = 400;
      throw err;
    }

    return this.deliveryOrderRepository.delete(orderId);
  }
}
