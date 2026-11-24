import { StatusDO } from "../../../domain/entities/DeliveryOrder.js";

function normalizeVehicleOwnership(value) {
  const ownership = String(value || "").trim().toUpperCase();
  if (ownership === "SEWA" || ownership === "VENDOR") return "VENDOR";
  if (ownership === "PRIBADI" || ownership === "MILIK_PRIBADI") return "PRIBADI";
  return null;
}

/**
 * Use Case: Input Surat Jalan dari Perusahaan (Pabrik) dan Penugasan Supir.
 * Dilakukan setelah SO di-ACC oleh Direktur (status DISETUJUI).
 * Status menjadi DALAM_PENGIRIMAN setelah dokumen dan detail armada lengkap.
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

    if (![StatusDO.DISETUJUI, StatusDO.DALAM_PENGIRIMAN, "APPROVED"].includes(order.status)) {
      const err = new Error("Detail dokumen dan armada hanya dapat diisi setelah SO disetujui Direktur");
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
    const tglDocPerusahaan = new Date(`${String(docData.tglDocPerusahaan).slice(0, 10)}T00:00:00.000Z`);
    if (Number.isNaN(tglDocPerusahaan.getTime())) {
      const err = new Error("Tanggal Dokumen / Surat Jalan tidak valid");
      err.statusCode = 400;
      throw err;
    }

    const namaSupir = String(docData.namaSupir || "").trim();
    const jenisKendaraan = normalizeVehicleOwnership(docData.jenisKendaraan);
    const noPolisiKendaraan = String(docData.noPolisiKendaraan || "").trim().toUpperCase();
    const tipeMobilRit = String(docData.tipeMobilRit || "").trim();
    if (!namaSupir || !jenisKendaraan || !noPolisiKendaraan || !tipeMobilRit) {
      const err = new Error("Nama supir, kepemilikan kendaraan (Vendor/Pribadi), nomor polisi, tipe mobil, dan rit wajib diisi");
      err.statusCode = 400;
      throw err;
    }

    const existingShipments = order.shipments || [];
    const existingOwnerships = existingShipments.map((shipment) =>
      normalizeVehicleOwnership(shipment.jenisKendaraan)
    );
    const legacyOwnership = normalizeVehicleOwnership(order.jenisKendaraan);
    if (
      existingOwnerships.some((ownership) => ownership == null) ||
      new Set(existingOwnerships).size > 1 ||
      (existingOwnerships.length > 0 && existingOwnerships[0] !== jenisKendaraan) ||
      (existingOwnerships.length === 0 && legacyOwnership && legacyOwnership !== jenisKendaraan)
    ) {
      const err = new Error("Semua DOC dalam satu SO harus menggunakan jenis kepemilikan yang sama");
      err.statusCode = 400;
      throw err;
    }

    const noDocPerusahaan = docData.noDocPerusahaan.trim();
    if (order.shipments?.some((shipment) => shipment.noDocPerusahaan === noDocPerusahaan)) {
      const err = new Error(`DOC ${noDocPerusahaan} sudah terdaftar pada SO ini`);
      err.statusCode = 409;
      throw err;
    }

    return this.deliveryOrderRepository.addShipment(orderId, {
      noDocPerusahaan,
      tglDocPerusahaan,
      namaSupir,
      jenisKendaraan,
      noPolisiKendaraan,
      tipeMobilRit,
    });
  }
}
