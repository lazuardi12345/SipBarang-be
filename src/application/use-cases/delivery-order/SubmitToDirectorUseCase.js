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

    const noDocPerusahaan = docData.noDocPerusahaan?.trim() || order.noDocPerusahaan?.trim();
    const tglDocPerusahaan = docData.tglDocPerusahaan || order.tglDocPerusahaan;
    const noSchedule = String(docData.noSchedule ?? order.noSchedule ?? "").trim();
    const tglSchedule = docData.tglSchedule ?? order.tglSchedule;
    const tipeMobilRit = String(docData.tipeMobilRit ?? order.tipeMobilRit ?? "").trim();
    const namaSupir = String(docData.namaSupir ?? order.namaSupir ?? "").trim();
    const noPolisiKendaraan = String(docData.noPolisiKendaraan ?? order.noPolisiKendaraan ?? "").trim();
    const rawUangJalanSupir = docData.uangJalanSupir;
    let uangJalanSupir = order.uangJalanSupir ?? null;

    if (!noDocPerusahaan || !tglDocPerusahaan) {
      const err = new Error("No. Doc dan tanggal surat jalan perusahaan wajib dilengkapi sebelum pengajuan");
      err.statusCode = 400;
      throw err;
    }
    if (!noSchedule || !tglSchedule || !tipeMobilRit || !namaSupir || !noPolisiKendaraan) {
      const err = new Error("No. Schedule, tanggal, tipe mobil/rit, nama supir, dan nomor polisi wajib dilengkapi sebelum pengajuan");
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
      tipeMobilRit,
      namaSupir,
      noPolisiKendaraan,
      noDocPerusahaan,
      tglDocPerusahaan,
      uangJalanSupir,
      keteranganDoc: docData.keteranganDoc !== undefined ? docData.keteranganDoc : order.keteranganDoc,
      status: StatusDO.MENUNGGU_ACC,
      updatedAt: new Date().toISOString(),
    };

    return this.deliveryOrderRepository.update(updated);
  }
}
