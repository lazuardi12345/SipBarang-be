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

export class VerifyInvoiceUseCase {
  constructor(invoiceRepository) {
    this.invoiceRepository = invoiceRepository;
  }

  async execute(id) {
    if (typeof id !== "string" || !/^[a-f0-9]{32,64}$/i.test(id)) {
      const err = new Error("Invoice tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    const invoice = await this.invoiceRepository.findByVerificationToken(id);
    if (!invoice) {
      const err = new Error("Invoice tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    const issuer = invoice.dibuatOleh || {};
    return {
      verified: issuer.role === "DIREKTUR",
      noInvoice: invoice.noInvoice,
      namaPelanggan: invoice.namaPelanggan,
      tanggalInvoice: invoice.tanggalInvoice,
      totalTagihan: invoice.totalTagihan,
      status: invoice.status,
      namaPengesah: issuer.nama || null,
      rolePengesah: issuer.role || null,
    };
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
