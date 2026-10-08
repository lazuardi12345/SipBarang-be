export class UpdateDeliveryOrderUseCase {
  constructor(deliveryOrderRepository) {
    this.deliveryOrderRepository = deliveryOrderRepository;
  }

  async execute(id, input = {}) {
    const existing = await this.deliveryOrderRepository.findById(id);
    if (!existing) {
      const err = new Error("Data Surat Jalan / Pengiriman tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    const updated = {
      ...existing,
      ...input,
      id,
      updatedAt: new Date().toISOString(),
    };

    return this.deliveryOrderRepository.update(updated);
  }
}
