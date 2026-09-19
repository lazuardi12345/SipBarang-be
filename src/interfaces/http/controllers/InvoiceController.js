export class InvoiceController {
  constructor(generateInvoiceUseCase, getInvoicesUseCase, getInvoiceByIdUseCase, updateInvoiceStatusUseCase) {
    this.generateInvoiceUseCase = generateInvoiceUseCase;
    this.getInvoicesUseCase = getInvoicesUseCase;
    this.getInvoiceByIdUseCase = getInvoiceByIdUseCase;
    this.updateInvoiceStatusUseCase = updateInvoiceStatusUseCase;
  }

  getAll = async (req, res, next) => {
    try {
      const invoices = await this.getInvoicesUseCase.execute();
      res.status(200).json({
        success: true,
        data: invoices,
      });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req, res, next) => {
    try {
      const invoice = await this.getInvoiceByIdUseCase.execute(req.params.id);
      res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const invoice = await this.generateInvoiceUseCase.execute(req.body, req.user);
      res.status(201).json({
        success: true,
        message: "Invoice berhasil diterbitkan",
        data: invoice,
      });
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const invoice = await this.updateInvoiceStatusUseCase.execute(id, status);
      res.status(200).json({
        success: true,
        message: `Status invoice berhasil diubah menjadi ${status}`,
        data: invoice,
      });
    } catch (err) {
      next(err);
    }
  };
}
