import { StatusDO } from "../../../domain/entities/DeliveryOrder.js";

export class ReportDeliveryUseCase {
  constructor(deliveryOrderRepository) {
    this.deliveryOrderRepository = deliveryOrderRepository;
  }

  async execute({ orderId, shipmentId, namaPenerimaBarang, catatanPelaporan, buktiPengirimanUrl }) {
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

    if (shipmentId) {
      const shipment = order.shipments?.find((item) => item.id === shipmentId);
      if (!shipment) {
        const err = new Error("DOC / kendaraan tidak ditemukan pada SO ini");
        err.statusCode = 404;
        throw err;
      }
      if (shipment.status !== StatusDO.DALAM_PENGIRIMAN) {
        const err = new Error("Kendaraan ini sudah dilaporkan tiba atau tidak sedang dalam perjalanan");
        err.statusCode = 400;
        throw err;
      }

      return this.deliveryOrderRepository.reportShipment(orderId, shipmentId, {
        namaPenerimaBarang,
        catatanPelaporan: catatanPelaporan || "",
        buktiPengirimanUrl: buktiPengirimanUrl || "",
        tanggalDiterima: new Date().toISOString(),
      });
    }

    if (order.status !== StatusDO.DALAM_PENGIRIMAN) {
      const err = new Error(
        "Pengiriman hanya bisa dilaporkan setelah dokumen dan detail armada dilengkapi"
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
