/**
 * Domain Entity: User
 */
export const UserRole = Object.freeze({
  DIREKTUR: "DIREKTUR",
  ADMIN: "ADMIN",
});

export class User {
  constructor({ id, nama, email, passwordHash, role = UserRole.ADMIN, createdAt = new Date().toISOString() }) {
    this.id = id;
    this.nama = nama;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
    this.createdAt = createdAt;
  }

  toSafeObject() {
    return {
      id: this.id,
      nama: this.nama,
      email: this.email,
      role: this.role,
      createdAt: this.createdAt,
    };
  }
}
