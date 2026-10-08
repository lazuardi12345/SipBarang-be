export class DeleteTarifUseCase {
  constructor(tarifRepository) {
    this.tarifRepository = tarifRepository;
  }

  async execute(id) {
    const existing = await this.tarifRepository.findById(id);
    if (!existing) {
      const error = new Error("Data tarif tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    return this.tarifRepository.delete(id);
  }
}
