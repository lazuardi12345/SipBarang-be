export class GetProfileUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      const err = new Error("User tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }
    return user.toSafeObject();
  }
}
