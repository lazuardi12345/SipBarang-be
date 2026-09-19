import { StatusDO } from "../../../domain/entities/DeliveryOrder.js";

export class ReportDeliveryUseCase {
  constructor(deliveryOrderRepository) {
    this.deliveryOrderRepository = deliveryOrderRepository;
  }

  async execute({ orderId, namaPenerimaBarang, catatanPelaporan, buktiPengirimanUrl }) {
    if (!orderId || !namaPenerimaBarang) {
      const err = new Error("Order ID dan nama penerima barang wajib diisi");
      err.statusCode = 400;
      throw err;
    }

    const order = await this.deliveryOrderRepository.findById(orderId);
    if (!order) {
      const err = new Error("Data Surat Jalan tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    if (
      order.status !== StatusDO.DISETUJUI &&
      order.status !== StatusDO.DALAM_PENGIRIMAN
    ) {
      const err = new Error(
        "Pengiriman hanya bisa dilaporkan setelah Surat Jalan disetujui oleh direktur"
      );
      err.statusCode = 400;
      throw err;
    }

    const now = new Date().toISOString();
    const updated = {
      ...order,
      status: StatusDO.MENUNGGU_KONFIRMASI,
      namaPenerimaBarang,
      catatanPelaporan: catatanPelaporan || "",
      buktiPengirimanUrl: buktiPengirimanUrl || "",
      tanggalDiterima: now,
      updatedAt: now,
    };

    return this.deliveryOrderRepository.update(updated);
  }
}
