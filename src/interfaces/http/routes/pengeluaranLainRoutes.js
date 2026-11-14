import { Router } from "express";

export function createPengeluaranLainRoutes(controller, authMiddleware, roleMiddleware) {
  const router = Router();

  router.use(authMiddleware);

  // Hanya DIREKTUR dan SUPERADMIN yang dapat melihat & mengelola pengeluaran lain-lain
  router.get("/", roleMiddleware(["DIREKTUR", "SUPERADMIN"]), controller.getAll);
  router.post("/", roleMiddleware(["DIREKTUR", "SUPERADMIN"]), controller.create);
  router.put("/:id", roleMiddleware(["DIREKTUR", "SUPERADMIN"]), controller.update);
  router.delete("/:id", roleMiddleware(["DIREKTUR", "SUPERADMIN"]), controller.delete);

  return router;
}

