import { PasswordHasher } from "../../../infrastructure/security/PasswordHasher.js";

export class LoginUseCase {
  constructor(userRepository, jwtService) {
    this.userRepository = userRepository;
    this.jwtService = jwtService;
  }

  async execute({ email, password }) {
    if (!email || !password) {
      const err = new Error("Email dan password wajib diisi");
      err.statusCode = 400;
      throw err;
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      const err = new Error("Email atau password tidak sesuai");
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await PasswordHasher.compare(password, user.passwordHash);
    if (!isMatch) {
      const err = new Error("Email atau password tidak sesuai");
      err.statusCode = 401;
      throw err;
    }

    const safeUser = user.toSafeObject();
    const token = this.jwtService.generateToken({
      id: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
    });

    return {
      user: safeUser,
      token,
    };
  }
}
