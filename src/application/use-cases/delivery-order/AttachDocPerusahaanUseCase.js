import { StatusDO } from "../../../domain/entities/DeliveryOrder.js";

/**
 * Use Case: Input Surat Jalan dari Perusahaan (Pabrik).
 * Mengubah planning pengiriman menjadi siap di-ACC Direktur
 * setelah surat jalan resmi dari perusahaan/pabrik turun.
 */
export class AttachDocPerusahaanUseCase {
  constructor(deliveryOrderRepository) {
    this.deliveryOrderRepository = deliveryOrderRepository;
  }

  async execute(orderId, docData, user) {
    const order = await this.deliveryOrderRepository.findById(orderId);
    if (!order) {
      const err = new Error("Data Surat Jalan / Planning tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    if (!docData.noDocPerusahaan) {
      const err = new Error("Nomor Dokumen / Surat Jalan dari Perusahaan wajib diisi");
      err.statusCode = 400;
      throw err;
    }

    const updated = {
      ...order,
      noDocPerusahaan: docData.noDocPerusahaan,
      tglDocPerusahaan: docData.tglDocPerusahaan || new Date().toISOString().split("T")[0],
      noSchedule: docData.noSchedule || order.noSchedule,
      keteranganDoc: docData.keteranganDoc || order.keteranganDoc,
      status: StatusDO.MENUNGGU_ACC, // Otomatis siap di-ACC Direktur!
      updatedAt: new Date().toISOString(),
    };

    return this.deliveryOrderRepository.update(updated);
  }
}
