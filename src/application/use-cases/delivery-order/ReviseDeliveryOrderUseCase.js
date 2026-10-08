import { StatusDO } from "../../../domain/entities/DeliveryOrder.js";

export class ReviseDeliveryOrderUseCase {
  constructor(deliveryOrderRepository) {
    this.deliveryOrderRepository = deliveryOrderRepository;
  }

  async execute(orderId, note = "") {
    const order = await this.deliveryOrderRepository.findById(orderId);

    if (!order) {
      const err = new Error("Data Surat Jalan / Pengiriman tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    if (![StatusDO.MENUNGGU_ACC, StatusDO.DITOLAK].includes(order.status)) {
      const err = new Error(
        `Surat Jalan tidak dapat direvisi karena status saat ini: ${order.status}. Hanya data menunggu ACC atau ditolak yang bisa direvisi.`
      );
      err.statusCode = 400;
      throw err;
    }

    const updated = {
      ...order,
      status: StatusDO.DRAFT,
      disetujuiOleh: null,
      disetujuiPada: null,
      catatanDirektur: note?.trim() ? note.trim() : null,
      dikonfirmasiOleh: null,
      dikonfirmasiPada: null,
      catatanKonfirmasiDirektur: null,
      namaPenerimaBarang: null,
      catatanPelaporan: null,
      buktiPengirimanUrl: null,
      tanggalDiterima: null,
      updatedAt: new Date().toISOString(),
    };

    return this.deliveryOrderRepository.update(updated);
  }
}
