import { Router } from "express";
import { UserRole } from "../../../domain/entities/User.js";

export function createTarifRoutes(tarifController, authMiddleware, roleMiddleware) {
  const router = Router();

  // Public/authenticated access to get tarif list
  router.get("/", tarifController.getAll);
  router.get("/:id", tarifController.getById);
  router.post("/", authMiddleware, roleMiddleware([UserRole.ADMIN]), tarifController.create);
  router.patch("/:id", authMiddleware, roleMiddleware([UserRole.ADMIN]), tarifController.update);
  router.delete("/:id", authMiddleware, roleMiddleware([UserRole.ADMIN]), tarifController.remove);

  return router;
}
