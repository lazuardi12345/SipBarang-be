export class GetDeliveryOrdersUseCase {
  constructor(deliveryOrderRepository) {
    this.deliveryOrderRepository = deliveryOrderRepository;
  }

  async execute(status) {
    if (status && status !== "SEMUA") {
      return this.deliveryOrderRepository.listByStatus(status);
    }
    return this.deliveryOrderRepository.list();
  }
}
