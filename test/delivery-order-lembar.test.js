import test from "node:test";
import assert from "node:assert/strict";
import { UpdateDeliveryOrderLembarUseCase } from "../src/application/use-cases/delivery-order/UpdateDeliveryOrderLembarUseCase.js";
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
