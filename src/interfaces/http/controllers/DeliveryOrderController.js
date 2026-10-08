export class DeliveryOrderController {
  constructor({
    createDeliveryOrderUseCase,
    getDeliveryOrdersUseCase,
    getDeliveryOrderByIdUseCase,
    updateDeliveryOrderUseCase,
    reviseDeliveryOrderUseCase,
    deleteDeliveryOrderUseCase,
    approveDeliveryOrderUseCase,
    rejectDeliveryOrderUseCase,
    reportDeliveryUseCase,
    attachDocPerusahaanUseCase,
    submitToDirectorUseCase,
    confirmDeliveredUseCase,
    consolidateRunUseCase,
  }) {
    this.createDeliveryOrderUseCase = createDeliveryOrderUseCase;
    this.getDeliveryOrdersUseCase = getDeliveryOrdersUseCase;
    this.getDeliveryOrderByIdUseCase = getDeliveryOrderByIdUseCase;
    this.updateDeliveryOrderUseCase = updateDeliveryOrderUseCase;
    this.reviseDeliveryOrderUseCase = reviseDeliveryOrderUseCase;
    this.deleteDeliveryOrderUseCase = deleteDeliveryOrderUseCase;
    this.approveDeliveryOrderUseCase = approveDeliveryOrderUseCase;
    this.rejectDeliveryOrderUseCase = rejectDeliveryOrderUseCase;
    this.reportDeliveryUseCase = reportDeliveryUseCase;
    this.attachDocPerusahaanUseCase = attachDocPerusahaanUseCase;
    this.submitToDirectorUseCase = submitToDirectorUseCase;
    this.confirmDeliveredUseCase = confirmDeliveredUseCase;
    this.consolidateRunUseCase = consolidateRunUseCase;
  }

  getAll = async (req, res, next) => {
    try {
      const { status } = req.query;
      const orders = await this.getDeliveryOrdersUseCase.execute(status);
      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req, res, next) => {
    try {
      const order = await this.getDeliveryOrderByIdUseCase.execute(req.params.id);
      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const order = await this.createDeliveryOrderUseCase.execute(req.body, req.user);
      res.status(201).json({
        success: true,
        message: "Rencana pengiriman berhasil disimpan",
        data: order,
      });
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const order = await this.updateDeliveryOrderUseCase.execute(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: "Data surat jalan berhasil diperbarui",
        data: order,
      });
    } catch (err) {
      next(err);
    }
  };

  revise = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { note } = req.body;
      const updated = await this.reviseDeliveryOrderUseCase.execute(id, note || "");
      res.status(200).json({
        success: true,
        message: "Surat jalan dikembalikan ke status revisi / draft",
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await this.deleteDeliveryOrderUseCase.execute(id);
      res.status(200).json({
        success: true,
        message: "Surat jalan berhasil dihapus",
        data: deleted,
      });
    } catch (err) {
      next(err);
    }
  };

  approve = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { catatan } = req.body;
      const updated = await this.approveDeliveryOrderUseCase.execute(id, req.user, catatan);
      res.status(200).json({
        success: true,
        message: "Surat Jalan berhasil disetujui",
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  };

  reject = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { catatan } = req.body;
      const updated = await this.rejectDeliveryOrderUseCase.execute(id, req.user, catatan);
      res.status(200).json({
        success: true,
        message: "Surat Jalan ditolak",
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  };

  reportDelivery = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { namaPenerimaBarang, catatanPelaporan, buktiPengirimanUrl } = req.body;
      const updated = await this.reportDeliveryUseCase.execute({
        orderId: id,
        namaPenerimaBarang,
        catatanPelaporan,
        buktiPengirimanUrl,
      });
      res.status(200).json({
        success: true,
        message: "Laporan pengiriman berhasil disimpan",
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  };

  attachDocPerusahaan = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated = await this.attachDocPerusahaanUseCase.execute(id, req.body, req.user);
      res.status(200).json({
        success: true,
        message: "No. Doc dan tanggal surat jalan perusahaan berhasil disimpan",
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  };

  submitToDirector = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated = await this.submitToDirectorUseCase.execute(id, req.body);
      res.status(200).json({
        success: true,
        message: "Pengiriman berhasil diajukan ke Direktur untuk di-ACC",
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  };

  confirmDelivered = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { catatan } = req.body;
      const updated = await this.confirmDeliveredUseCase.execute(id, req.user, catatan);
      res.status(200).json({
        success: true,
        message: "Laporan pengiriman telah dikonfirmasi (TERKIRIM) oleh Direktur",
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  };

  consolidateRun = async (req, res, next) => {
    try {
      const updated = await this.consolidateRunUseCase.execute(req.body);
      res.status(200).json({
        success: true,
        message: "Pengiriman berhasil disatukan dalam satu kali jalan",
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  };
}
