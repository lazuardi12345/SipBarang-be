/**
 * MysqlUserRepository — Implementasi IUserRepository menggunakan Prisma.
 */
import { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { User } from "../../domain/entities/User.js";

export class MysqlUserRepository extends IUserRepository {
  constructor(prismaClient) {
    super();
    this.prisma = prismaClient;
  }

  _toEntity(row) {
    if (!row) return null;
    return new User({
      id: row.id,
      nama: row.nama,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role,
      createdAt: row.createdAt?.toISOString?.() || row.createdAt,
    });
  }

  async findByEmail(email) {
    const row = await this.prisma.user.findUnique({
      where: { email },
    });
    return this._toEntity(row);
  }

  async findById(id) {
    const row = await this.prisma.user.findUnique({
      where: { id },
    });
    return this._toEntity(row);
  }

  async create(user) {
    const row = await this.prisma.user.create({
      data: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
      },
    });
    return this._toEntity(row);
  }

  async list() {
    const rows = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => this._toEntity(r));
  }
}
