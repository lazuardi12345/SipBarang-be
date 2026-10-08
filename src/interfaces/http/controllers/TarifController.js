export class TarifController {
  constructor(getTarifListUseCase, getTarifByIdUseCase, createTarifUseCase, updateTarifUseCase, deleteTarifUseCase) {
    this.getTarifListUseCase = getTarifListUseCase;
    this.getTarifByIdUseCase = getTarifByIdUseCase;
    this.createTarifUseCase = createTarifUseCase;
    this.updateTarifUseCase = updateTarifUseCase;
    this.deleteTarifUseCase = deleteTarifUseCase;
  }

  getAll = async (req, res, next) => {
    try {
      const tarifs = await this.getTarifListUseCase.execute();
      res.status(200).json({
        success: true,
        data: tarifs,
      });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req, res, next) => {
    try {
      const tarif = await this.getTarifByIdUseCase.execute(req.params.id);
      res.status(200).json({
        success: true,
        data: tarif,
      });
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const tarif = await this.createTarifUseCase.execute(req.body);
      res.status(201).json({
        success: true,
        data: tarif,
        message: "Master tujuan berhasil ditambahkan",
      });
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const tarif = await this.updateTarifUseCase.execute(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: tarif,
        message: "Master tujuan berhasil diperbarui",
      });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req, res, next) => {
    try {
      const tarif = await this.deleteTarifUseCase.execute(req.params.id);
      res.status(200).json({
        success: true,
        data: tarif,
        message: "Master tujuan berhasil dihapus",
      });
    } catch (err) {
      next(err);
    }
  };
}
