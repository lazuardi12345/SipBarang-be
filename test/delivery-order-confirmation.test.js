import test from "node:test";
import assert from "node:assert/strict";
import { ConfirmDeliveredUseCase } from "../src/application/use-cases/delivery-order/ConfirmDeliveredUseCase.js";
import { StatusDO } from "../src/domain/entities/DeliveryOrder.js";
import { DeliveryOrderConfirmationRepository } from "../src/infrastructure/repositories/delivery-order/DeliveryOrderConfirmationRepository.js";
import { MysqlDeliveryOrderRepository } from "../src/infrastructure/repositories/MysqlDeliveryOrderRepository.js";

test("director confirmation is persisted with the user and confirmation timestamp", async () => {
  let savedConfirmation;
  const repository = new DeliveryOrderConfirmationRepository({
    deliveryOrderConfirmation: {
      create: async ({ data }) => {
        savedConfirmation = data;
        return data;
      },
    },
  });
  const confirmedAt = "2026-10-15T10:00:00.000Z";

  await repository.create("do-1", {
    konfirmasiUserId: "director-1",
    dikonfirmasiPada: confirmedAt,
    catatanKonfirmasiDirektur: "Sesuai",
  });

  assert.deepEqual(savedConfirmation, {
    orderId: "do-1",
    userId: "director-1",
    catatanKonfirmasiDirektur: "Sesuai",
    confirmedAt,
  });
});

test("delivery order reads confirmation timestamp from its confirmation relation", async () => {
  const repository = new MysqlDeliveryOrderRepository({
    tarif: {
      findUnique: async () => null,
      findFirst: async () => null,
    },
  });
  const entity = await repository._toEntity({
    id: "do-1",
    noDo: "DO-1",
    status: StatusDO.TERKIRIM,
    confirmations: [
      {
        userId: "director-1",
        confirmedAt: new Date("2026-10-15T10:00:00.000Z"),
        catatanKonfirmasiDirektur: "Sesuai",
      },
    ],
  });

  assert.equal(entity.dikonfirmasiPada, "2026-10-15T10:00:00.000Z");
  assert.equal(entity.dikonfirmasiOleh, "director-1");
  assert.equal(entity.catatanKonfirmasiDirektur, "Sesuai");
});

test("confirming delivered order passes director ID to repository persistence", async () => {
  let updatedOrder;
  const useCase = new ConfirmDeliveredUseCase({
    findById: async () => ({
      id: "do-1",
      status: StatusDO.MENUNGGU_KONFIRMASI,
    }),
    update: async (order) => {
      updatedOrder = order;
      return order;
    },
  });

  await useCase.execute("do-1", { id: "director-1", nama: "Direktur" }, "Sesuai");

  assert.equal(updatedOrder.konfirmasiUserId, "director-1");
  assert.equal(updatedOrder.dikonfirmasiOleh, "Direktur");
  assert.ok(updatedOrder.dikonfirmasiPada);
});

test("delivery order update saves confirmation on transition to delivered", async () => {
  const confirmedAt = "2026-10-15T10:00:00.000Z";
  let findCount = 0;
  let savedConfirmation;
  const repository = new MysqlDeliveryOrderRepository({
    deliveryOrder: {
      findUnique: async () => {
        findCount += 1;
        return findCount === 1
          ? { id: "do-1", status: StatusDO.MENUNGGU_KONFIRMASI }
          : {
              id: "do-1",
              noDo: "DO-1",
              status: StatusDO.TERKIRIM,
              confirmations: [{
                userId: "director-1",
                confirmedAt: new Date(confirmedAt),
              }],
            };
      },
      update: async () => ({ id: "do-1", noDo: "DO-1", status: StatusDO.TERKIRIM }),
    },
  });
  repository.scheduleRepository.toPrismaData = () => null;
  repository.documentRepository.toPrismaData = () => null;
  repository.confirmationRepository.create = async (orderId, order) => {
    savedConfirmation = { orderId, ...order };
  };
  repository.reportRepository.upsert = async () => {};

  const updated = await repository.update({
    id: "do-1",
    noDO: "DO-1",
    status: StatusDO.TERKIRIM,
    konfirmasiUserId: "director-1",
    dikonfirmasiPada: confirmedAt,
  });

  assert.equal(savedConfirmation.orderId, "do-1");
  assert.equal(savedConfirmation.konfirmasiUserId, "director-1");
  assert.equal(updated.dikonfirmasiPada, confirmedAt);
});
