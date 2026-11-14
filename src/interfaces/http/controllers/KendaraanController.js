export class KendaraanController {
  constructor(getKendaraansUseCase, createKendaraanUseCase, updateKendaraanUseCase, deleteKendaraanUseCase) {
    this.getKendaraansUseCase = getKendaraansUseCase;
    this.createKendaraanUseCase = createKendaraanUseCase;
    this.updateKendaraanUseCase = updateKendaraanUseCase;
    this.deleteKendaraanUseCase = deleteKendaraanUseCase;
  }

  getAll = async (req, res, next) => {
    try {
      const list = await this.getKendaraansUseCase.execute();
      res.status(200).json({
        success: true,
        data: list,
      });
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const data = await this.createKendaraanUseCase.execute(req.body);
      res.status(201).json({
        success: true,
        data,
        message: "Kendaraan berhasil ditambahkan",
      });
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const data = await this.updateKendaraanUseCase.execute(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data,
        message: "Data kendaraan berhasil diperbarui",
      });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req, res, next) => {
    try {
      await this.deleteKendaraanUseCase.execute(req.params.id);
      res.status(200).json({
        success: true,
        message: "Kendaraan berhasil dihapus",
      });
    } catch (err) {
      next(err);
    }
  };
}

