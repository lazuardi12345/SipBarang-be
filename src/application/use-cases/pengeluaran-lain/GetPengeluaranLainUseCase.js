export class GetPengeluaranLainUseCase {
  constructor(pengeluaranLainRepository) {
    this.pengeluaranLainRepository = pengeluaranLainRepository;
  }

  async execute(options = {}) {
    return this.pengeluaranLainRepository.findAll(options);
  }
}

