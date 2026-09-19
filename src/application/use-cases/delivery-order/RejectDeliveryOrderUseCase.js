import { StatusDO } from "../../../domain/entities/DeliveryOrder.js";

export class RejectDeliveryOrderUseCase {
  constructor(deliveryOrderRepository) {
    this.deliveryOrderRepository = deliveryOrderRepository;
  }

  async execute(orderId, direkturUser, catatan) {
    if (!catatan || catatan.trim() === "") {
      const err = new Error("Alasan / catatan penolakan wajib diisi");
      err.statusCode = 400;
      throw err;
    }

    const order = await this.deliveryOrderRepository.findById(orderId);
    if (!order) {
      const err = new Error("Data Surat Jalan tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    if (order.status !== StatusDO.MENUNGGU_ACC && order.status !== StatusDO.MENUNGGU_KONFIRMASI) {
      const err = new Error(`Surat Jalan tidak dalam status Menunggu ACC atau Menunggu Konfirmasi (status saat ini: ${order.status})`);
      err.statusCode = 400;
      throw err;
    }

    const updated = {
      ...order,
      status: StatusDO.DITOLAK,
      disetujuiOleh: direkturUser.nama || direkturUser.id,
      disetujuiPada: new Date().toISOString(),
      catatanDirektur: catatan,
      updatedAt: new Date().toISOString(),
    };

    return this.deliveryOrderRepository.update(updated);
  }
}
