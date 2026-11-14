export class DeleteKendaraanUseCase {
  constructor(kendaraanRepository) {
    this.kendaraanRepository = kendaraanRepository;
  }

  async execute(id) {
    const existing = await this.kendaraanRepository.findById(id);
    if (!existing || !existing.active) {
      const error = new Error("Kendaraan tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    return this.kendaraanRepository.delete(id);
  }
}

