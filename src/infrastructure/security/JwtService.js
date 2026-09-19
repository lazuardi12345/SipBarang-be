import jwt from "jsonwebtoken";

export class JwtService {
  constructor(secret = process.env.JWT_SECRET || "default_secret", expiresIn = process.env.JWT_EXPIRES_IN || "7d") {
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  generateToken(payload) {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.secret);
    } catch {
      return null;
    }
  }
}
