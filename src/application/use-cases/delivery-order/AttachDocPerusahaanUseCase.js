import { StatusDO } from "../../../domain/entities/DeliveryOrder.js";

/**
 * Use Case: Input Surat Jalan dari Perusahaan (Pabrik).
 * Menyimpan No. Doc dan tanggal tanpa mengajukan pengiriman ke Direktur.
 */
export class AttachDocPerusahaanUseCase {
  constructor(deliveryOrderRepository) {
    this.deliveryOrderRepository = deliveryOrderRepository;
  }

  async execute(orderId, docData) {
    const order = await this.deliveryOrderRepository.findById(orderId);
    if (!order) {
      const err = new Error("Data Surat Jalan / Planning tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    if (order.status !== StatusDO.DRAFT && order.status !== StatusDO.PLANNING) {
      const err = new Error("Dokumen hanya dapat dilengkapi sebelum pengiriman diajukan ke Direktur");
      err.statusCode = 400;
      throw err;
    }

    if (!docData.noDocPerusahaan?.trim()) {
      const err = new Error("Nomor Dokumen / Surat Jalan dari Perusahaan wajib diisi");
      err.statusCode = 400;
      throw err;
    }
    if (!docData.tglDocPerusahaan) {
      const err = new Error("Tanggal Dokumen / Surat Jalan dari Perusahaan wajib diisi");
      err.statusCode = 400;
      throw err;
    }

    const updated = {
      ...order,
      noDocPerusahaan: docData.noDocPerusahaan.trim(),
      tglDocPerusahaan: docData.tglDocPerusahaan,
      noSchedule: docData.noSchedule || order.noSchedule,
      keteranganDoc: docData.keteranganDoc || order.keteranganDoc,
      status: order.status,
      updatedAt: new Date().toISOString(),
    };

    return this.deliveryOrderRepository.update(updated);
  }
}
