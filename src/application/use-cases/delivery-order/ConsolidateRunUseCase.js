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
    submitToDirector = false,
  }) {
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      const err = new Error("Pilih minimal satu pengiriman untuk disatukan dalam satu kali jalan");
      err.statusCode = 400;
      throw err;
    }

    const updatedOrders = [];
    const now = new Date().toISOString();

    for (const id of orderIds) {
      const order = await this.deliveryOrderRepository.findById(id);
      if (!order) continue;

      const updated = {
        ...order,
        noSchedule: noSchedule || order.noSchedule,
        tglSchedule: tglSchedule || order.tglSchedule,
        namaSupir: namaSupir || order.namaSupir,
        noHpSupir: noHpSupir !== undefined ? noHpSupir : order.noHpSupir,
        noPolisiKendaraan: noPolisiKendaraan || order.noPolisiKendaraan,
        tipeMobilRit: tipeMobilRit || order.tipeMobilRit,
        gudangAsal: gudangAsal || order.gudangAsal,
        status: submitToDirector ? StatusDO.MENUNGGU_ACC : order.status,
        updatedAt: now,
      };

      const saved = await this.deliveryOrderRepository.update(updated);
      updatedOrders.push(saved);
    }

    return updatedOrders;
  }
}
