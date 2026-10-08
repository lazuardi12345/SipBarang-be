import { Router } from "express";
import { UserRole } from "../../../domain/entities/User.js";

export function createDeliveryOrderRoutes(deliveryOrderController, authMiddleware, roleMiddleware) {
  const router = Router();

  // All delivery order routes require authentication
  router.use(authMiddleware);

  // List all delivery orders (Admin & Direktur can view)
  router.get("/", deliveryOrderController.getAll);

  // Get specific delivery order
  router.get("/:id", deliveryOrderController.getById);

  // === ADMIN OPERASIONAL ONLY ===
  // Create new delivery order
  router.post("/", roleMiddleware([UserRole.ADMIN]), deliveryOrderController.create);

  // Edit / revise a submitted order
  router.patch("/:id", roleMiddleware([UserRole.ADMIN]), deliveryOrderController.update);
  router.patch("/:id/revise", roleMiddleware([UserRole.ADMIN]), deliveryOrderController.revise);
  router.delete("/:id", roleMiddleware([UserRole.ADMIN]), deliveryOrderController.remove);

  // Satukan beberapa tujuan ke dalam 1 kali jalan armada (Rit)
  router.post("/batch/consolidate-run", roleMiddleware([UserRole.ADMIN]), deliveryOrderController.consolidateRun);

  // Input Surat Jalan Perusahaan (Setelah dokumen pabrik turun)
  router.patch("/:id/attach-doc", roleMiddleware([UserRole.ADMIN]), deliveryOrderController.attachDocPerusahaan);

  // Submit DO ke Direktur untuk di-ACC (dari DRAFT / PLANNING)
  router.patch("/:id/submit", roleMiddleware([UserRole.ADMIN]), deliveryOrderController.submitToDirector);

  // Report delivery finished / arrived (Admin/Supir lapor -> status jadi MENUNGGU_KONFIRMASI)
  router.patch("/:id/report", roleMiddleware([UserRole.ADMIN]), deliveryOrderController.reportDelivery);

  // === DIREKTUR UTAMA ONLY (Admin TIDAK BISA ACC/TOLAK) ===
  // Approval Berangkat (Gate 1)
  router.patch("/:id/approve", roleMiddleware([UserRole.DIREKTUR]), deliveryOrderController.approve);
  router.patch("/:id/reject", roleMiddleware([UserRole.DIREKTUR]), deliveryOrderController.reject);

  // Direktur Konfirmasi Pengiriman Selesai (Gate 2: MENUNGGU_KONFIRMASI -> TERKIRIM)
  router.patch("/:id/confirm-delivered", roleMiddleware([UserRole.DIREKTUR]), deliveryOrderController.confirmDelivered);

  return router;
}
