import { Router } from "express";
import { UserRole } from "../../../domain/entities/User.js";

export function createInvoiceRoutes(invoiceController, authMiddleware, roleMiddleware) {
  const router = Router();

  router.get("/verify/:token", invoiceController.verify);

  // All invoice routes require authentication
  router.use(authMiddleware);

  router.get("/", invoiceController.getAll);
  router.get("/:id", invoiceController.getById);
  router.post("/", roleMiddleware([UserRole.DIREKTUR]), invoiceController.create);
  router.patch("/:id/status", invoiceController.updateStatus);

  return router;
}
