import { Router } from "express";

export function createApiRouter({ authRoutes, deliveryOrderRoutes, invoiceRoutes, tarifRoutes }) {
  const apiRouter = Router();

  apiRouter.get("/health", (req, res) => {
    res.json({
      status: "ok",
      service: "Delivery Order Backend",
      timestamp: new Date().toISOString(),
    });
  });

  apiRouter.use("/auth", authRoutes);
  apiRouter.use("/delivery-orders", deliveryOrderRoutes);
  apiRouter.use("/invoices", invoiceRoutes);
  apiRouter.use("/tarif", tarifRoutes);

  return apiRouter;
}
