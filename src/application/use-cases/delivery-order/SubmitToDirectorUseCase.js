import { StatusDO } from "../../../domain/entities/DeliveryOrder.js";

/**
 * Use Case: Mengajukan Surat Jalan (DO) ke Direktur untuk di-ACC.
 * Dilakukan setelah Surat Jalan dari perusahaan/pabrik sudah turun/diinput.
 * Mengubah status dari DRAFT / PLANNING -> MENUNGGU_ACC
 */
export class SubmitToDirectorUseCase {
  constructor(deliveryOrderRepository) {
    this.deliveryOrderRepository = deliveryOrderRepository;
  }

  async execute(orderId, docData = {}) {
    const order = await this.deliveryOrderRepository.findById(orderId);
    if (!order) {
      const err = new Error("Data Surat Jalan / Pengiriman tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    if (order.status !== StatusDO.DRAFT && order.status !== StatusDO.PLANNING) {
      const err = new Error(
        `Surat Jalan tidak dapat diajukan karena status saat ini: ${order.status}. Hanya DRAFT yang dapat diajukan.`
      );
      err.statusCode = 400;
      throw err;
    }

    const updated = {
      ...order,
      noDocPerusahaan: docData.noDocPerusahaan || order.noDocPerusahaan || "",
      tglDocPerusahaan: docData.tglDocPerusahaan || order.tglDocPerusahaan || new Date().toISOString().split("T")[0],
      keteranganDoc: docData.keteranganDoc !== undefined ? docData.keteranganDoc : order.keteranganDoc,
      status: StatusDO.MENUNGGU_ACC,
      updatedAt: new Date().toISOString(),
    };

    return this.deliveryOrderRepository.update(updated);
  }
}
