/**
 * Composition Root — Dependency Injection Container
 * Menggunakan MySQL repositories (bukan JSON file lagi).
 */
import { getPool } from "./infrastructure/database/MysqlDatabase.js";
import { MysqlUserRepository } from "./infrastructure/repositories/MysqlUserRepository.js";
import { MysqlDeliveryOrderRepository } from "./infrastructure/repositories/MysqlDeliveryOrderRepository.js";
import { MysqlInvoiceRepository } from "./infrastructure/repositories/MysqlInvoiceRepository.js";
import { MysqlTarifRepository } from "./infrastructure/repositories/MysqlTarifRepository.js";
import { JwtService } from "./infrastructure/security/JwtService.js";
import { createAuthMiddleware } from "./infrastructure/http/middlewares/authMiddleware.js";
import { createRoleMiddleware } from "./infrastructure/http/middlewares/roleMiddleware.js";

// Use Cases - Auth
import { RegisterUseCase } from "./application/use-cases/auth/RegisterUseCase.js";
import { LoginUseCase } from "./application/use-cases/auth/LoginUseCase.js";
import { GetProfileUseCase } from "./application/use-cases/auth/GetProfileUseCase.js";

// Use Cases - Delivery Order
import { CreateDeliveryOrderUseCase } from "./application/use-cases/delivery-order/CreateDeliveryOrderUseCase.js";
import { GetDeliveryOrdersUseCase } from "./application/use-cases/delivery-order/GetDeliveryOrdersUseCase.js";
import { GetDeliveryOrderByIdUseCase } from "./application/use-cases/delivery-order/GetDeliveryOrderByIdUseCase.js";
import { ApproveDeliveryOrderUseCase } from "./application/use-cases/delivery-order/ApproveDeliveryOrderUseCase.js";
import { RejectDeliveryOrderUseCase } from "./application/use-cases/delivery-order/RejectDeliveryOrderUseCase.js";
import { ReportDeliveryUseCase } from "./application/use-cases/delivery-order/ReportDeliveryUseCase.js";
import { AttachDocPerusahaanUseCase } from "./application/use-cases/delivery-order/AttachDocPerusahaanUseCase.js";
import { SubmitToDirectorUseCase } from "./application/use-cases/delivery-order/SubmitToDirectorUseCase.js";
import { ConfirmDeliveredUseCase } from "./application/use-cases/delivery-order/ConfirmDeliveredUseCase.js";
import { ConsolidateRunUseCase } from "./application/use-cases/delivery-order/ConsolidateRunUseCase.js";

// Use Cases - Invoice
import { GenerateInvoiceUseCase } from "./application/use-cases/invoice/GenerateInvoiceUseCase.js";
import { GetInvoicesUseCase, GetInvoiceByIdUseCase, UpdateInvoiceStatusUseCase } from "./application/use-cases/invoice/GetInvoicesUseCase.js";

// Use Cases - Tarif
import { GetTarifListUseCase, GetTarifByIdUseCase } from "./application/use-cases/tarif/GetTarifListUseCase.js";
import { CreateTarifUseCase } from "./application/use-cases/tarif/CreateTarifUseCase.js";

// Controllers
import { AuthController } from "./interfaces/http/controllers/AuthController.js";
import { DeliveryOrderController } from "./interfaces/http/controllers/DeliveryOrderController.js";
import { InvoiceController } from "./interfaces/http/controllers/InvoiceController.js";
import { TarifController } from "./interfaces/http/controllers/TarifController.js";

// Routes
import { createAuthRoutes } from "./interfaces/http/routes/authRoutes.js";
import { createDeliveryOrderRoutes } from "./interfaces/http/routes/deliveryOrderRoutes.js";
import { createInvoiceRoutes } from "./interfaces/http/routes/invoiceRoutes.js";
import { createTarifRoutes } from "./interfaces/http/routes/tarifRoutes.js";
import { createApiRouter } from "./interfaces/http/routes/apiRouter.js";

export async function createContainer() {
  // 1. MySQL Connection Pool
  const pool = await getPool();

  // 2. Repositories (MySQL)
  const userRepository = new MysqlUserRepository(pool);
  const deliveryOrderRepository = new MysqlDeliveryOrderRepository(pool);
  const invoiceRepository = new MysqlInvoiceRepository(pool);
  const tarifRepository = new MysqlTarifRepository(pool);

  // 3. Services
  const jwtService = new JwtService();

  // 4. Middlewares
  const authMiddleware = createAuthMiddleware(jwtService, userRepository);
  const roleMiddleware = createRoleMiddleware;

  // 5. Use Cases
  const registerUseCase = new RegisterUseCase(userRepository);
  const loginUseCase = new LoginUseCase(userRepository, jwtService);
  const getProfileUseCase = new GetProfileUseCase(userRepository);

  const createDeliveryOrderUseCase = new CreateDeliveryOrderUseCase(deliveryOrderRepository, tarifRepository);
  const getDeliveryOrdersUseCase = new GetDeliveryOrdersUseCase(deliveryOrderRepository);
  const getDeliveryOrderByIdUseCase = new GetDeliveryOrderByIdUseCase(deliveryOrderRepository);
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

  // 6. Controllers
  const authController = new AuthController(registerUseCase, loginUseCase, getProfileUseCase);
  const deliveryOrderController = new DeliveryOrderController({
    createDeliveryOrderUseCase,
    getDeliveryOrdersUseCase,
    getDeliveryOrderByIdUseCase,
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
  const tarifController = new TarifController(getTarifListUseCase, getTarifByIdUseCase, createTarifUseCase);

  // 7. Routes
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
    pool,
    userRepository,
    deliveryOrderRepository,
    invoiceRepository,
    tarifRepository,
    apiRouter,
  };
}
