import { Router } from "express";
import { UserRole } from "../../../domain/entities/User.js";

export function createKendaraanRoutes(kendaraanController, authMiddleware, roleMiddleware) {
  const router = Router();

  router.get("/", authMiddleware, kendaraanController.getAll);
  router.post("/", authMiddleware, roleMiddleware([UserRole.ADMIN, UserRole.DIREKTUR, UserRole.SUPERADMIN]), kendaraanController.create);
  router.patch("/:id", authMiddleware, roleMiddleware([UserRole.ADMIN, UserRole.DIREKTUR, UserRole.SUPERADMIN]), kendaraanController.update);
  router.delete("/:id", authMiddleware, roleMiddleware([UserRole.ADMIN, UserRole.DIREKTUR, UserRole.SUPERADMIN]), kendaraanController.remove);

  return router;
}

