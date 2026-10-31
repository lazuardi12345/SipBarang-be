/**
 * Domain Entity: User
 */
export const UserRole = Object.freeze({
  DIREKTUR: "DIREKTUR",
  ADMIN: "ADMIN",
  SUPERADMIN: "SUPERADMIN",
});

export class User {
  constructor({ id, nama, email, passwordHash, role = UserRole.ADMIN, active = true, createdAt = new Date().toISOString() }) {
    this.id = id;
    this.nama = nama;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
    this.active = active;
    this.createdAt = createdAt;
  }

  toSafeObject() {
    return {
      id: this.id,
      nama: this.nama,
      email: this.email,
      role: this.role,
      active: this.active,
      createdAt: this.createdAt,
    };
  }
}
