import test from "node:test";
import assert from "node:assert/strict";
import { UpdateDeliveryOrderLembarUseCase } from "../src/application/use-cases/delivery-order/UpdateDeliveryOrderLembarUseCase.js";
import { UpdateDeliveryOrderMdoUseCase } from "../src/application/use-cases/delivery-order/UpdateDeliveryOrderMdoUseCase.js";
import { DeliveryOrderDocumentRepository } from "../src/infrastructure/repositories/delivery-order/DeliveryOrderDocumentRepository.js";

test("Lembar update trims the value and persists the updated delivery order", async () => {
  let savedOrder;
  const repository = {
    findById: async (id) => ({ id, noDO: "DO-1", status: "TERKIRIM", lembar: "" }),
    update: async (order) => {
      savedOrder = order;
      return order;
    },
  };
  const useCase = new UpdateDeliveryOrderLembarUseCase(repository);

  const result = await useCase.execute("do-1", { lembar: "  3  " });

  assert.equal(savedOrder.lembar, "3");
  assert.equal(result.id, "do-1");
});

test("Lembar update reports missing delivery orders", async () => {
  const useCase = new UpdateDeliveryOrderLembarUseCase({
    findById: async () => null,
  });

  await assert.rejects(
    useCase.execute("missing", { lembar: "1" }),
    { statusCode: 404, message: "Data Surat Jalan / Pengiriman tidak ditemukan" }
  );
});

test("Lembar update rejects invalid and oversized values", async () => {
  const useCase = new UpdateDeliveryOrderLembarUseCase({
    findById: async (id) => ({ id }),
  });

  await assert.rejects(useCase.execute("do-1", { lembar: 1 }), { statusCode: 400 });
  await assert.rejects(useCase.execute("do-1", { lembar: "x".repeat(101) }), { statusCode: 400 });
});

test("delivery document mapping keeps the Lembar value through Prisma persistence", () => {
  const repository = new DeliveryOrderDocumentRepository({});
  const data = repository.toPrismaData({ noDO: "DO-1", lembar: "2" });
  assert.equal(data.lembar, "2");
  assert.equal(repository.toEntity({ lembar: "2" }).lembar, "2");
});

test("MDO update trims the value and persists independently of schedule number", async () => {
  let savedOrder;
  const repository = {
    findById: async (id) => ({
      id,
      noDO: "DO-1",
      noSchedule: "SCH-123",
      mdo: "",
    }),
    update: async (order) => {
      savedOrder = order;
      return order;
    },
  };
  const useCase = new UpdateDeliveryOrderMdoUseCase(repository);

  const result = await useCase.execute("do-1", { mdo: "  MDO-456  " });

  assert.equal(savedOrder.mdo, "MDO-456");
  assert.equal(savedOrder.noSchedule, "SCH-123");
  assert.equal(result.id, "do-1");
});

test("MDO update reports missing delivery orders and rejects invalid values", async () => {
  const missingUseCase = new UpdateDeliveryOrderMdoUseCase({
    findById: async () => null,
  });
  await assert.rejects(
    missingUseCase.execute("missing", { mdo: "MDO-1" }),
    { statusCode: 404 }
  );

  const useCase = new UpdateDeliveryOrderMdoUseCase({
    findById: async (id) => ({ id }),
  });
  await assert.rejects(useCase.execute("do-1", { mdo: 1 }), { statusCode: 400 });
  await assert.rejects(useCase.execute("do-1", { mdo: "x".repeat(101) }), { statusCode: 400 });
});

test("delivery document mapping persists and reads MDO separately from schedule", () => {
  const repository = new DeliveryOrderDocumentRepository({});
  const data = repository.toPrismaData({
    noSchedule: "SCH-123",
    mdo: "MDO-456",
    lembar: "2",
  });
  const document = repository.toEntity(data);

  assert.equal(data.mdo, "MDO-456");
  assert.equal(document.mdo, "MDO-456");
  assert.equal(document.lembar, "2");
  assert.equal(data.noSchedule, undefined);
});
