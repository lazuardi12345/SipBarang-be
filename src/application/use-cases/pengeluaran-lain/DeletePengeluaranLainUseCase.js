export class DeletePengeluaranLainUseCase {
  constructor(pengeluaranLainRepository) {
    this.pengeluaranLainRepository = pengeluaranLainRepository;
  }

  async execute(id) {
    const existing = await this.pengeluaranLainRepository.findById(id);
    if (!existing) {
      const err = new Error("Data pengeluaran tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    return this.pengeluaranLainRepository.delete(id);
  }
}

