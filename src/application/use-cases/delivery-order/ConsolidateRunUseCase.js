import { StatusDO } from "../../../domain/entities/DeliveryOrder.js";

/**
 * Use Case: Menyatukan beberapa tujuan pengiriman ke dalam SATU KALI JALAN (1 Rit Armada).
 * Memperbarui armada (supir, plat nomor, jadwal) untuk semua tujuan yang dipilih.
 * Setiap tujuan tetap memiliki DO mandiri agar Direktur bisa meng-ACC satu per satu tujuan.
 */
export class ConsolidateRunUseCase {
  constructor(deliveryOrderRepository) {
    this.deliveryOrderRepository = deliveryOrderRepository;
  }

  async execute({
    orderIds,
    noSchedule,
    tglSchedule,
    namaSupir,
    noHpSupir,
    noPolisiKendaraan,
    tipeMobilRit,
    gudangAsal,
    orderDocumentData = {},
    submitToDirector = false,
  }) {
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      const err = new Error("Pilih minimal satu pengiriman untuk disatukan dalam satu kali jalan");
      err.statusCode = 400;
      throw err;
    }

    if (!noSchedule?.trim() || !tglSchedule || !tipeMobilRit?.trim() || !namaSupir?.trim() || !noPolisiKendaraan?.trim()) {
      const err = new Error("Nomor/tanggal schedule, tipe mobil/rit, nama supir, dan nomor polisi wajib diisi");
      err.statusCode = 400;
      throw err;
    }

    const orders = [];
    for (const id of orderIds) {
      const order = await this.deliveryOrderRepository.findById(id);
      if (!order) {
        const err = new Error(`Pengiriman ${id} tidak ditemukan`);
        err.statusCode = 404;
        throw err;
      }
      if (order.status !== StatusDO.DRAFT && order.status !== StatusDO.PLANNING) {
        const err = new Error(`${order.noDO} bukan lagi rencana pengiriman yang bisa dijadwalkan`);
        err.statusCode = 400;
        throw err;
      }
      const doc = orderDocumentData[id] || {};
      if (!(doc.noDocPerusahaan || order.noDocPerusahaan)?.trim() || !(doc.tglDocPerusahaan || order.tglDocPerusahaan)) {
        const err = new Error(`No. Doc dan tanggal surat jalan perusahaan wajib diisi untuk ${order.namaToko || order.noDO}`);
        err.statusCode = 400;
        throw err;
      }
      orders.push({ order, doc });
    }

    const updatedOrders = [];
    const now = new Date().toISOString();

    for (const { order, doc } of orders) {
      const updated = {
        ...order,
        noSchedule: noSchedule.trim(),
        tglSchedule: tglSchedule || order.tglSchedule,
        namaSupir: namaSupir || order.namaSupir,
        noHpSupir: noHpSupir !== undefined ? noHpSupir : order.noHpSupir,
        noPolisiKendaraan: noPolisiKendaraan || order.noPolisiKendaraan,
        tipeMobilRit: tipeMobilRit || order.tipeMobilRit,
        gudangAsal: gudangAsal || order.gudangAsal,
        noDocPerusahaan: (doc.noDocPerusahaan || order.noDocPerusahaan).trim(),
        tglDocPerusahaan: doc.tglDocPerusahaan || order.tglDocPerusahaan,
        salesman: doc.salesman ?? order.salesman,
        agen: doc.agen ?? order.agen,
        kota: doc.kota ?? order.kota,
        kecamatan: doc.kecamatan ?? order.kecamatan,
        keteranganDoc: doc.keteranganDoc ?? order.keteranganDoc,
        status: submitToDirector ? StatusDO.MENUNGGU_ACC : order.status,
        updatedAt: now,
      };

      const saved = await this.deliveryOrderRepository.update(updated);
      updatedOrders.push(saved);
    }

    return updatedOrders;
  }
}
