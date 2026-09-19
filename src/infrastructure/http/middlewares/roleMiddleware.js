export function createRoleMiddleware(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Otentikasi diperlukan",
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak: Operasi ini hanya boleh dilakukan oleh role [${allowedRoles.join(", ")}]`,
      });
    }

    next();
  };
}
