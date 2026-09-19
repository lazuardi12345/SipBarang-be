import crypto from "crypto";
import { User, UserRole } from "../../../domain/entities/User.js";
import { PasswordHasher } from "../../../infrastructure/security/PasswordHasher.js";

export class RegisterUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ nama, email, password, role = UserRole.ADMIN }) {
    if (!nama || !email || !password) {
      const err = new Error("Nama, email, dan password wajib diisi");
      err.statusCode = 400;
      throw err;
    }

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      const err = new Error("Email sudah terdaftar, silakan gunakan email lain atau login");
      err.statusCode = 400;
      throw err;
    }

    const passwordHash = await PasswordHasher.hash(password);
    const id = `usr-${crypto.randomBytes(6).toString("hex")}`;
    const newUser = new User({
      id,
      nama,
      email,
      passwordHash,
      role: role.toUpperCase() === UserRole.DIREKTUR ? UserRole.DIREKTUR : UserRole.ADMIN,
      createdAt: new Date().toISOString(),
    });

    const savedUser = await this.userRepository.create(newUser);
    return savedUser.toSafeObject();
  }
}
