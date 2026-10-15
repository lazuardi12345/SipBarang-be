export class UpdateDeliveryOrderLembarUseCase {
  constructor(deliveryOrderRepository) {
    this.deliveryOrderRepository = deliveryOrderRepository;
  }

  async execute(orderId, input = {}) {
    const order = await this.deliveryOrderRepository.findById(orderId);
    if (!order) {
      const err = new Error("Data Surat Jalan / Pengiriman tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    if (!input || typeof input.lembar !== "string" || input.lembar.length > 100) {
      const err = new Error("Kolom lembar wajib berupa teks maksimal 100 karakter");
      err.statusCode = 400;
      throw err;
    }

    return this.deliveryOrderRepository.update({
      ...order,
      lembar: input.lembar.trim(),
      updatedAt: new Date().toISOString(),
    });
  }
}
