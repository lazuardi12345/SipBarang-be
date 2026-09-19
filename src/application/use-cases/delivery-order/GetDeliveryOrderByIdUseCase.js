export class GetDeliveryOrderByIdUseCase {
  constructor(deliveryOrderRepository) {
    this.deliveryOrderRepository = deliveryOrderRepository;
  }

  async execute(id) {
    const order = await this.deliveryOrderRepository.findById(id);
    if (!order) {
      const err = new Error("Data Surat Jalan tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }
    return order;
  }
}
