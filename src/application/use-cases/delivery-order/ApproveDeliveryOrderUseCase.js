import { StatusDO } from "../../../domain/entities/DeliveryOrder.js";

export class ApproveDeliveryOrderUseCase {
  constructor(deliveryOrderRepository) {
    this.deliveryOrderRepository = deliveryOrderRepository;
  }

  async execute(orderId, direkturUser, catatan = "") {
    const order = await this.deliveryOrderRepository.findById(orderId);
    if (!order) {
      const err = new Error("Data Surat Jalan tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    if (order.status !== StatusDO.MENUNGGU_ACC) {
      const err = new Error(`Surat Jalan tidak dalam status Menunggu ACC (status saat ini: ${order.status})`);
      err.statusCode = 400;
      throw err;
    }

    const updated = {
      ...order,
      status: StatusDO.DISETUJUI,
      disetujuiOleh: direkturUser.nama || direkturUser.id,
      disetujuiPada: new Date().toISOString(),
      catatanDirektur: catatan,
      updatedAt: new Date().toISOString(),
    };

    return this.deliveryOrderRepository.update(updated);
  }
}
