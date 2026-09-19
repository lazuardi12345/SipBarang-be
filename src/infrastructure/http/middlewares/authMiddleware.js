export function createAuthMiddleware(jwtService, userRepository) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Akses ditolak: Token otentikasi tidak ditemukan",
        });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwtService.verifyToken(token);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: "Sesi telah berakhir atau token tidak valid, silakan login ulang",
        });
      }

      const user = await userRepository.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Pengguna tidak ditemukan",
        });
      }

      req.user = user.toSafeObject();
      next();
    } catch (err) {
      next(err);
    }
  };
}
