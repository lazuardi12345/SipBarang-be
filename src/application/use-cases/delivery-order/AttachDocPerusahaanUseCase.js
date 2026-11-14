import { StatusDO } from "../../../domain/entities/DeliveryOrder.js";

/**
 * Use Case: Input Surat Jalan dari Perusahaan (Pabrik) dan Penugasan Supir.
 * Dilakukan setelah SO di-ACC oleh Direktur (status DISETUJUI), atau pada tahap draft/planning.
 * Saat dokumen pabrik dan supir sudah terpasang pada order yang di-ACC, status otomatis menjadi DALAM_PENGIRIMAN.
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

    if (order.status === StatusDO.TERKIRIM || order.status === StatusDO.MENUNGGU_KONFIRMASI) {
      const err = new Error("Surat jalan dan supir tidak dapat diubah karena pengiriman sudah selesai/dalam konfirmasi terkirim");
      err.statusCode = 400;
      throw err;
    }

    if (!docData.noDocPerusahaan?.trim()) {
      const err = new Error("Nomor Dokumen / Surat Jalan dari Perusahaan (Pabrik) wajib diisi");
      err.statusCode = 400;
      throw err;
    }
    if (!docData.tglDocPerusahaan) {
      const err = new Error("Tanggal Dokumen / Surat Jalan dari Perusahaan wajib diisi");
      err.statusCode = 400;
      throw err;
    }

    const namaSupir = docData.namaSupir !== undefined ? String(docData.namaSupir || "").trim() : order.namaSupir;
    const noHpSupir = docData.noHpSupir !== undefined ? String(docData.noHpSupir || "").trim() : order.noHpSupir;

    // Jika order sudah di-ACC Direktur (DISETUJUI) dan supir serta dokumen sudah ada, status menjadi DALAM_PENGIRIMAN
    let newStatus = order.status;
    if (order.status === StatusDO.DISETUJUI && namaSupir) {
      newStatus = StatusDO.DALAM_PENGIRIMAN;
    }

    const updated = {
      ...order,
      noDocPerusahaan: docData.noDocPerusahaan.trim(),
      tglDocPerusahaan: docData.tglDocPerusahaan,
      namaSupir: namaSupir || order.namaSupir,
      noHpSupir: noHpSupir || order.noHpSupir,
      noSchedule: docData.noSchedule || order.noSchedule,
      keteranganDoc: docData.keteranganDoc || order.keteranganDoc,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    return this.deliveryOrderRepository.update(updated);
  }
}
