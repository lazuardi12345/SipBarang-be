import { Router } from "express";

export function createInvoiceRoutes(invoiceController, authMiddleware) {
  const router = Router();

  // All invoice routes require authentication
  router.use(authMiddleware);

  router.get("/", invoiceController.getAll);
  router.get("/:id", invoiceController.getById);
  router.post("/", invoiceController.create);
  router.patch("/:id/status", invoiceController.updateStatus);

  return router;
}
