import { StatusDO } from "../../../domain/entities/DeliveryOrder.js";

/**
 * Use Case: Direktur meng-ACC / konfirmasi laporan pengiriman selesai.
 * Mengubah status dari MENUNGGU_KONFIRMASI -> TERKIRIM
 * Setelah ini, order siap dibuatkan invoice resmi.
 */
export class ConfirmDeliveredUseCase {
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

    if (order.status !== StatusDO.MENUNGGU_KONFIRMASI) {
      const err = new Error(
        `Surat Jalan tidak dalam status Menunggu Konfirmasi Terkirim (status saat ini: ${order.status})`
      );
      err.statusCode = 400;
      throw err;
    }

    const now = new Date().toISOString();
    const updated = {
      ...order,
      status: StatusDO.TERKIRIM,
      dikonfirmasiOleh: direkturUser.nama || direkturUser.id,
      dikonfirmasiPada: now,
      catatanKonfirmasiDirektur: catatan || "",
      updatedAt: now,
    };

    return this.deliveryOrderRepository.update(updated);
  }
}
