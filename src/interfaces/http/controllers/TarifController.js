export class TarifController {
  constructor(getTarifListUseCase, getTarifByIdUseCase, createTarifUseCase) {
    this.getTarifListUseCase = getTarifListUseCase;
    this.getTarifByIdUseCase = getTarifByIdUseCase;
    this.createTarifUseCase = createTarifUseCase;
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
}
