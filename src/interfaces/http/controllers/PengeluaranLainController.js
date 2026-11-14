export class PengeluaranLainController {
  constructor({
    getPengeluaranLainUseCase,
    createPengeluaranLainUseCase,
    updatePengeluaranLainUseCase,
    deletePengeluaranLainUseCase,
  }) {
    this.getPengeluaranLainUseCase = getPengeluaranLainUseCase;
    this.createPengeluaranLainUseCase = createPengeluaranLainUseCase;
    this.updatePengeluaranLainUseCase = updatePengeluaranLainUseCase;
    this.deletePengeluaranLainUseCase = deletePengeluaranLainUseCase;
  }

  getAll = async (req, res, next) => {
    try {
      const { startDate, endDate, kategori } = req.query;
      const list = await this.getPengeluaranLainUseCase.execute({
        startDate,
        endDate,
        kategori,
      });
      res.json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const created = await this.createPengeluaranLainUseCase.execute(req.body, req.user);
      res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const updated = await this.updatePengeluaranLainUseCase.execute(req.params.id, req.body, req.user);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      await this.deletePengeluaranLainUseCase.execute(req.params.id);
      res.json({ success: true, message: "Pengeluaran berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };
}

