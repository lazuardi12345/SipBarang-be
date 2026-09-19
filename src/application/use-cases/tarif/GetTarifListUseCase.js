export class GetTarifListUseCase {
  constructor(tarifRepository) {
    this.tarifRepository = tarifRepository;
  }

  async execute() {
    return this.tarifRepository.list();
  }
}

export class GetTarifByIdUseCase {
  constructor(tarifRepository) {
    this.tarifRepository = tarifRepository;
  }

  async execute(id) {
    const tarif = await this.tarifRepository.findById(id);
    if (!tarif) {
      const err = new Error("Data tarif tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }
    return tarif;
  }
}
