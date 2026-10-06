/**
 * MysqlUserRepository — Implementasi IUserRepository menggunakan MySQL.
 */
import { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { User } from "../../domain/entities/User.js";

export class MysqlUserRepository extends IUserRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  _toEntity(row) {
    if (!row) return null;
    return new User({
      id: row.id,
      nama: row.nama,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: row.created_at?.toISOString?.() || row.created_at,
    });
  }

  async findByEmail(email) {
    const [rows] = await this.pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
      [email]
    );
    return this._toEntity(rows[0]);
  }

  async findById(id) {
    const [rows] = await this.pool.query("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
    return this._toEntity(rows[0]);
  }

  async create(user) {
    await this.pool.query(
      "INSERT INTO users (id, nama, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
      [user.id, user.nama, user.email, user.passwordHash, user.role]
    );
    return this._toEntity({
      ...user,
      password_hash: user.passwordHash,
      created_at: new Date().toISOString(),
    });
  }

  async list() {
    const [rows] = await this.pool.query("SELECT * FROM users ORDER BY created_at DESC");
    return rows.map((r) => this._toEntity(r));
  }
}
