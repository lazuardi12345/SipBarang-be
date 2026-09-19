export class GetInvoicesUseCase {
  constructor(invoiceRepository) {
    this.invoiceRepository = invoiceRepository;
  }

  async execute() {
    return this.invoiceRepository.list();
  }
}

export class GetInvoiceByIdUseCase {
  constructor(invoiceRepository) {
    this.invoiceRepository = invoiceRepository;
  }

  async execute(id) {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      const err = new Error("Invoice tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }
    return invoice;
  }
}

export class UpdateInvoiceStatusUseCase {
  constructor(invoiceRepository) {
    this.invoiceRepository = invoiceRepository;
  }

  async execute(id, status) {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      const err = new Error("Invoice tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    const updated = {
      ...invoice,
      status,
      updatedAt: new Date().toISOString(),
    };

    return this.invoiceRepository.update(updated);
  }
}
