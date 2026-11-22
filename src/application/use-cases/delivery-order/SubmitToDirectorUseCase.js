import { StatusDO } from "../../../domain/entities/DeliveryOrder.js";

/**
 * Use Case: Mengajukan Surat Jalan (DO) ke Direktur untuk di-ACC.
 * Mengajukan data dasar SO dan uang jalan dari DRAFT / PLANNING ke direktur.
 * Dokumen perusahaan dan detail armada diisi setelah SO disetujui.
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

    const noSchedule = String(docData.noSchedule ?? order.noSchedule ?? "").trim();
    const tglSchedule = docData.tglSchedule ?? order.tglSchedule;
    const rawUangJalanSupir = docData.uangJalanSupir;
    let uangJalanSupir = order.uangJalanSupir ?? null;

    if (!noSchedule || !tglSchedule) {
      const err = new Error("No. SO dan tanggal SO wajib diisi sebelum pengajuan ke Direktur");
      err.statusCode = 400;
      throw err;
    }
    if (rawUangJalanSupir !== undefined && rawUangJalanSupir !== null) {
      uangJalanSupir =
        typeof rawUangJalanSupir === "number"
          ? rawUangJalanSupir
          : typeof rawUangJalanSupir === "string" && rawUangJalanSupir.trim() !== ""
          ? Number(rawUangJalanSupir)
          : Number.NaN;

      if (!Number.isFinite(uangJalanSupir) || uangJalanSupir < 0) {
        const err = new Error("Uang jalan supir harus berupa nominal tidak negatif jika diisi");
        err.statusCode = 400;
        throw err;
      }
    }

    const updated = {
      ...order,
      noSchedule,
      tglSchedule,
      uangJalanSupir,
      status: StatusDO.MENUNGGU_ACC,
      updatedAt: new Date().toISOString(),
    };

    return this.deliveryOrderRepository.update(updated);
  }
}
