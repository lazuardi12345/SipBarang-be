/**
 * MysqlUserRepository — Implementasi IUserRepository menggunakan MySQL.
 */
import { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { User, UserRole } from "../../domain/entities/User.js";
import bcrypt from "bcryptjs";

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

  async initDefaultUsers() {
    const [rows] = await this.pool.query("SELECT COUNT(*) as cnt FROM users");
    if (rows[0].cnt > 0) return;

    const salt = await bcrypt.genSalt(10);
    const defaults = [
      {
        id: "usr-direktur-01",
        nama: "Direktur Utama",
        email: "direktur@ayt.co.id",
        hash: await bcrypt.hash("direktur123", salt),
        role: UserRole.DIREKTUR,
      },
      {
        id: "usr-admin-01",
        nama: "Admin Operasional",
        email: "admin@ayt.co.id",
        hash: await bcrypt.hash("admin123", salt),
        role: UserRole.ADMIN,
      },
    ];

    for (const u of defaults) {
      await this.pool.query(
        "INSERT IGNORE INTO users (id, nama, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
        [u.id, u.nama, u.email, u.hash, u.role]
      );
    }
  }

  async findByEmail(email) {
    await this.initDefaultUsers();
    const [rows] = await this.pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
      [email]
    );
    return this._toEntity(rows[0]);
  }

  async findById(id) {
    await this.initDefaultUsers();
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
    await this.initDefaultUsers();
    const [rows] = await this.pool.query("SELECT * FROM users ORDER BY created_at DESC");
    return rows.map((r) => this._toEntity(r));
  }
}
