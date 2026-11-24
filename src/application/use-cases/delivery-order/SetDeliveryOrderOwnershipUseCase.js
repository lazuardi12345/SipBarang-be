import { StatusDO } from "../../../domain/entities/DeliveryOrder.js";

function normalizeVehicleOwnership(value) {
  const ownership = String(value || "").trim().toUpperCase();
  if (ownership === "PRIBADI" || ownership === "MILIK_PRIBADI") return "PRIBADI";
  if (ownership === "VENDOR" || ownership === "SEWA" || ownership === "ORANG_LAIN") {
    return "VENDOR";
  }
  return null;
}

export class SetDeliveryOrderOwnershipUseCase {
  constructor(deliveryOrderRepository) {
    this.deliveryOrderRepository = deliveryOrderRepository;
  }

  async execute(orderId, input = {}) {
    const order = await this.deliveryOrderRepository.findById(orderId);
    if (!order) {
      const err = new Error("Data pengiriman tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    if (order.status !== StatusDO.TERKIRIM) {
      const err = new Error("Kepemilikan kendaraan hanya dapat dilengkapi setelah SO berstatus TERKIRIM");
      err.statusCode = 400;
      throw err;
    }

    const ownership = normalizeVehicleOwnership(input.jenisKendaraan);
    if (!ownership) {
      const err = new Error("Jenis kepemilikan harus Pribadi atau Vendor");
      err.statusCode = 400;
      throw err;
    }

    const shipments = Array.isArray(order.shipments) ? order.shipments : [];
    const existingOwnerships = shipments.length > 0
      ? shipments.map((shipment) => normalizeVehicleOwnership(shipment.jenisKendaraan))
      : [normalizeVehicleOwnership(order.jenisKendaraan)];
    const knownOwnerships = new Set(existingOwnerships.filter(Boolean));
    const needsOwnership = existingOwnerships.some((value) => value == null)
      || knownOwnerships.size > 1;

    if (!needsOwnership) {
      const err = new Error("Kepemilikan SO ini sudah terisi dan tidak dapat diubah dari dashboard");
      err.statusCode = 409;
      throw err;
    }

    const updated = await this.deliveryOrderRepository.updateVehicleOwnership(orderId, ownership);
    if (!updated) {
      const err = new Error("Data schedule atau DOC kendaraan tidak ditemukan untuk diperbarui");
      err.statusCode = 409;
      throw err;
    }
    return updated;
  }
}
