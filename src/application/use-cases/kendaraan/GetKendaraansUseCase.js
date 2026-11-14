export class GetKendaraansUseCase {
  constructor(kendaraanRepository) {
    this.kendaraanRepository = kendaraanRepository;
  }

  async execute() {
    return this.kendaraanRepository.list();
  }
}

