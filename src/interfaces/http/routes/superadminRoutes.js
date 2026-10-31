import { Router } from "express";
import { UserRole } from "../../../domain/entities/User.js";

export function createSuperadminRoutes(controller, authMiddleware, roleMiddleware) {
  const router = Router();
  router.use(authMiddleware, roleMiddleware([UserRole.SUPERADMIN]));

  router.get("/", controller.overview);

  router.post("/users", controller.createUser);
  router.patch("/users/:id", controller.updateUser);

  router.post("/tarifs", controller.createTarif);
  router.patch("/tarifs/:id", controller.updateTarif);

  router.post("/delivery-orders", controller.createDeliveryOrder);
  router.patch("/delivery-orders/:id", controller.updateDeliveryOrder);
  router.post("/delivery-orders/:orderId/reports", controller.createReport);
  router.patch("/delivery-orders/:orderId/reports/:reportId", controller.updateReport);

  router.post("/invoices", controller.createInvoice);
  router.patch("/invoices/:id", controller.updateInvoice);

  return router;
}
