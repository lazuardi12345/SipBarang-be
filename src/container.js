/**
 * Composition Root — Dependency Injection Container
 * Menyusun semua dependency sesuai arsitektur clean architecture.
 */
import prisma from "./infrastructure/database/prisma.js";
import { MysqlUserRepository } from "./infrastructure/repositories/MysqlUserRepository.js";
import { MysqlDeliveryOrderRepository } from "./infrastructure/repositories/MysqlDeliveryOrderRepository.js";
import { MysqlInvoiceRepository } from "./infrastructure/repositories/MysqlInvoiceRepository.js";
import { MysqlTarifRepository } from "./infrastructure/repositories/MysqlTarifRepository.js";
import { JwtService } from "./infrastructure/security/JwtService.js";
import { createAuthMiddleware } from "./infrastructure/http/middlewares/authMiddleware.js";
import { createRoleMiddleware } from "./infrastructure/http/middlewares/roleMiddleware.js";

import { RegisterUseCase } from "./application/use-cases/auth/RegisterUseCase.js";
import { LoginUseCase } from "./application/use-cases/auth/LoginUseCase.js";
import { GetProfileUseCase } from "./application/use-cases/auth/GetProfileUseCase.js";

import { CreateDeliveryOrderUseCase } from "./application/use-cases/delivery-order/CreateDeliveryOrderUseCase.js";
import { GetDeliveryOrdersUseCase } from "./application/use-cases/delivery-order/GetDeliveryOrdersUseCase.js";
import { GetDeliveryOrderByIdUseCase } from "./application/use-cases/delivery-order/GetDeliveryOrderByIdUseCase.js";
import { UpdateDeliveryOrderUseCase } from "./application/use-cases/delivery-order/UpdateDeliveryOrderUseCase.js";
import { ReviseDeliveryOrderUseCase } from "./application/use-cases/delivery-order/ReviseDeliveryOrderUseCase.js";
import { DeleteDeliveryOrderUseCase } from "./application/use-cases/delivery-order/DeleteDeliveryOrderUseCase.js";
import { ApproveDeliveryOrderUseCase } from "./application/use-cases/delivery-order/ApproveDeliveryOrderUseCase.js";
import { RejectDeliveryOrderUseCase } from "./application/use-cases/delivery-order/RejectDeliveryOrderUseCase.js";
import { ReportDeliveryUseCase } from "./application/use-cases/delivery-order/ReportDeliveryUseCase.js";
import { AttachDocPerusahaanUseCase } from "./application/use-cases/delivery-order/AttachDocPerusahaanUseCase.js";
import { SubmitToDirectorUseCase } from "./application/use-cases/delivery-order/SubmitToDirectorUseCase.js";
import { ConfirmDeliveredUseCase } from "./application/use-cases/delivery-order/ConfirmDeliveredUseCase.js";
import { ConsolidateRunUseCase } from "./application/use-cases/delivery-order/ConsolidateRunUseCase.js";

import { GenerateInvoiceUseCase } from "./application/use-cases/invoice/GenerateInvoiceUseCase.js";
import { GetInvoicesUseCase, GetInvoiceByIdUseCase, UpdateInvoiceStatusUseCase } from "./application/use-cases/invoice/GetInvoicesUseCase.js";

import { GetTarifListUseCase, GetTarifByIdUseCase } from "./application/use-cases/tarif/GetTarifListUseCase.js";
import { CreateTarifUseCase } from "./application/use-cases/tarif/CreateTarifUseCase.js";
import { UpdateTarifUseCase } from "./application/use-cases/tarif/UpdateTarifUseCase.js";
import { DeleteTarifUseCase } from "./application/use-cases/tarif/DeleteTarifUseCase.js";

import { AuthController } from "./interfaces/http/controllers/AuthController.js";
import { DeliveryOrderController } from "./interfaces/http/controllers/DeliveryOrderController.js";
import { InvoiceController } from "./interfaces/http/controllers/InvoiceController.js";
import { TarifController } from "./interfaces/http/controllers/TarifController.js";

import { createAuthRoutes } from "./interfaces/http/routes/authRoutes.js";
import { createDeliveryOrderRoutes } from "./interfaces/http/routes/deliveryOrderRoutes.js";
import { createInvoiceRoutes } from "./interfaces/http/routes/invoiceRoutes.js";
import { createTarifRoutes } from "./interfaces/http/routes/tarifRoutes.js";
import { createApiRouter } from "./interfaces/http/routes/apiRouter.js";

export async function createContainer() {
  const userRepository = new MysqlUserRepository(prisma);
  const deliveryOrderRepository = new MysqlDeliveryOrderRepository(prisma);
  const invoiceRepository = new MysqlInvoiceRepository(prisma);
  const tarifRepository = new MysqlTarifRepository(prisma);

  const jwtService = new JwtService();
  const authMiddleware = createAuthMiddleware(jwtService, userRepository);
  const roleMiddleware = createRoleMiddleware;

  const registerUseCase = new RegisterUseCase(userRepository);
  const loginUseCase = new LoginUseCase(userRepository, jwtService);
  const getProfileUseCase = new GetProfileUseCase(userRepository);

  const createDeliveryOrderUseCase = new CreateDeliveryOrderUseCase(deliveryOrderRepository, tarifRepository);
  const getDeliveryOrdersUseCase = new GetDeliveryOrdersUseCase(deliveryOrderRepository);
  const getDeliveryOrderByIdUseCase = new GetDeliveryOrderByIdUseCase(deliveryOrderRepository);
  const updateDeliveryOrderUseCase = new UpdateDeliveryOrderUseCase(deliveryOrderRepository);
  const reviseDeliveryOrderUseCase = new ReviseDeliveryOrderUseCase(deliveryOrderRepository);
  const deleteDeliveryOrderUseCase = new DeleteDeliveryOrderUseCase(deliveryOrderRepository);
  const approveDeliveryOrderUseCase = new ApproveDeliveryOrderUseCase(deliveryOrderRepository);
  const rejectDeliveryOrderUseCase = new RejectDeliveryOrderUseCase(deliveryOrderRepository);
  const reportDeliveryUseCase = new ReportDeliveryUseCase(deliveryOrderRepository);
  const attachDocPerusahaanUseCase = new AttachDocPerusahaanUseCase(deliveryOrderRepository);
  const submitToDirectorUseCase = new SubmitToDirectorUseCase(deliveryOrderRepository);
  const confirmDeliveredUseCase = new ConfirmDeliveredUseCase(deliveryOrderRepository);
  const consolidateRunUseCase = new ConsolidateRunUseCase(deliveryOrderRepository);

  const generateInvoiceUseCase = new GenerateInvoiceUseCase(invoiceRepository, deliveryOrderRepository);
  const getInvoicesUseCase = new GetInvoicesUseCase(invoiceRepository);
  const getInvoiceByIdUseCase = new GetInvoiceByIdUseCase(invoiceRepository);
  const updateInvoiceStatusUseCase = new UpdateInvoiceStatusUseCase(invoiceRepository);

  const getTarifListUseCase = new GetTarifListUseCase(tarifRepository);
  const getTarifByIdUseCase = new GetTarifByIdUseCase(tarifRepository);
  const createTarifUseCase = new CreateTarifUseCase(tarifRepository);
  const updateTarifUseCase = new UpdateTarifUseCase(tarifRepository);
  const deleteTarifUseCase = new DeleteTarifUseCase(tarifRepository);

  const authController = new AuthController(registerUseCase, loginUseCase, getProfileUseCase);
  const deliveryOrderController = new DeliveryOrderController({
    createDeliveryOrderUseCase,
    getDeliveryOrdersUseCase,
    getDeliveryOrderByIdUseCase,
    updateDeliveryOrderUseCase,
    reviseDeliveryOrderUseCase,
    deleteDeliveryOrderUseCase,
    approveDeliveryOrderUseCase,
    rejectDeliveryOrderUseCase,
    reportDeliveryUseCase,
    attachDocPerusahaanUseCase,
    submitToDirectorUseCase,
    confirmDeliveredUseCase,
    consolidateRunUseCase,
  });
  const invoiceController = new InvoiceController(
    generateInvoiceUseCase,
    getInvoicesUseCase,
    getInvoiceByIdUseCase,
    updateInvoiceStatusUseCase
  );
  const tarifController = new TarifController(
    getTarifListUseCase,
    getTarifByIdUseCase,
    createTarifUseCase,
    updateTarifUseCase,
    deleteTarifUseCase
  );

  const authRoutes = createAuthRoutes(authController, authMiddleware);
  const deliveryOrderRoutes = createDeliveryOrderRoutes(deliveryOrderController, authMiddleware, roleMiddleware);
  const invoiceRoutes = createInvoiceRoutes(invoiceController, authMiddleware);
  const tarifRoutes = createTarifRoutes(tarifController, authMiddleware, roleMiddleware);

  const apiRouter = createApiRouter({
    authRoutes,
    deliveryOrderRoutes,
    invoiceRoutes,
    tarifRoutes,
  });

  return {
    prisma,
    userRepository,
    deliveryOrderRepository,
    invoiceRepository,
    tarifRepository,
    apiRouter,
  };
}
