import { Router } from "express";
import { addRealtimeClient, publishDataChanged } from "../../../infrastructure/http/realtimeEvents.js";

export function createApiRouter({
  authRoutes,
  deliveryOrderRoutes,
  invoiceRoutes,
  tarifRoutes,
  authMiddleware,
}) {
  const apiRouter = Router();

  apiRouter.use((req, res, next) => {
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
    const resource = req.path.split("/").filter(Boolean)[0];
    if (!isMutation || !["delivery-orders", "invoices", "tarif"].includes(resource)) {
      next();
      return;
    }

    res.once("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        publishDataChanged({
          resource,
          method: req.method,
          timestamp: new Date().toISOString(),
        });
      }
    });
    next();
  });

  apiRouter.get("/health", (req, res) => {
    res.json({
      status: "ok",
      service: "Delivery Order Backend",
      timestamp: new Date().toISOString(),
    });
  });

  apiRouter.get("/events", authMiddleware, (req, res) => {
    res.status(200);
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
    res.write("retry: 3000\n\n");

    const removeClient = addRealtimeClient(res);
    const heartbeat = setInterval(() => {
      if (!res.destroyed && !res.writableEnded) res.write(": keep-alive\n\n");
    }, 25_000);

    res.on("close", () => {
      clearInterval(heartbeat);
      removeClient();
    });
  });

  apiRouter.use("/auth", authRoutes);
  apiRouter.use("/delivery-orders", deliveryOrderRoutes);
  apiRouter.use("/invoices", invoiceRoutes);
  apiRouter.use("/tarif", tarifRoutes);

  return apiRouter;
}
